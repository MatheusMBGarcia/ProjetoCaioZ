const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();
const app = express();
const bcrypt = require("bcryptjs");
app.use(cors()); app.use(express.json());
const pool=mysql.createPool({host:process.env.DB_HOST,port:process.env.DB_PORT,user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME,connectionLimit:10});
function q(id){return '`'+String(id).replace(/`/g,'')+'`'}
const schemaCache=new Map();
async function columns(table){if(schemaCache.has(table))return schemaCache.get(table);const [rows]=await pool.query('SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?',[table]);const s=new Set(rows.map(r=>r.COLUMN_NAME));schemaCache.set(table,s);return s}
async function ensureSchema(){
 const stmts=[
 `CREATE TABLE IF NOT EXISTS produtos (id INT AUTO_INCREMENT PRIMARY KEY,sku VARCHAR(80) NULL UNIQUE,estoque_categoria VARCHAR(20) NOT NULL DEFAULT 'INTERNO',nome VARCHAR(180) NOT NULL,tipo VARCHAR(80) NOT NULL DEFAULT 'Material',unidade VARCHAR(20) NOT NULL DEFAULT 'un',marca VARCHAR(120) NULL,modelo VARCHAR(120) NULL,estoque DECIMAL(12,3) NOT NULL DEFAULT 0,estoque_minimo DECIMAL(12,3) NOT NULL DEFAULT 0,preco_custo DECIMAL(12,2) NOT NULL DEFAULT 0,preco_venda DECIMAL(12,2) NOT NULL DEFAULT 0,localizacao VARCHAR(120) NULL,categoria_id INT NULL,fornecedor_id INT NULL,ativo TINYINT(1) NOT NULL DEFAULT 1,criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
 `CREATE TABLE IF NOT EXISTS categorias (id INT AUTO_INCREMENT PRIMARY KEY,nome VARCHAR(150) NOT NULL UNIQUE,descricao TEXT NULL,estoque_categoria VARCHAR(20) NOT NULL DEFAULT 'INTERNO',ativo TINYINT(1) NOT NULL DEFAULT 1,criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
 `CREATE TABLE IF NOT EXISTS fornecedores (id INT AUTO_INCREMENT PRIMARY KEY,nome VARCHAR(180) NOT NULL,cnpj VARCHAR(30) NULL,email VARCHAR(180) NULL,telefone VARCHAR(40) NULL,contato VARCHAR(120) NULL,endereco VARCHAR(255) NULL,cidade VARCHAR(120) NULL,estado VARCHAR(2) NULL,observacao TEXT NULL,ativo TINYINT(1) NOT NULL DEFAULT 1,criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
 `CREATE TABLE IF NOT EXISTS usuarios (id INT AUTO_INCREMENT PRIMARY KEY,nome VARCHAR(180) NOT NULL,email VARCHAR(180) NOT NULL UNIQUE,senha VARCHAR(255) NOT NULL,role VARCHAR(30) NOT NULL DEFAULT 'FUNCIONARIO',ativo TINYINT(1) NOT NULL DEFAULT 1,criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
 `CREATE TABLE IF NOT EXISTS movimentacoes (id BIGINT AUTO_INCREMENT PRIMARY KEY,produto_id INT NOT NULL,usuario_id INT NULL,tipo VARCHAR(20) NOT NULL,quantidade DECIMAL(12,3) NOT NULL,estoque_anterior DECIMAL(12,3) NOT NULL DEFAULT 0,estoque_posterior DECIMAL(12,3) NOT NULL DEFAULT 0,fornecedor_id INT NULL,documento VARCHAR(120) NULL,motivo VARCHAR(120) NULL,destino VARCHAR(180) NULL,observacao TEXT NULL,data_movimentacao DATE NULL,criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,INDEX idx_mov_produto(produto_id),INDEX idx_mov_tipo(tipo),INDEX idx_mov_data(data_movimentacao)) ENGINE=InnoDB`,
 `CREATE TABLE IF NOT EXISTS fichas_producao (id INT AUTO_INCREMENT PRIMARY KEY,produto_id INT NOT NULL UNIQUE,ativo TINYINT(1) NOT NULL DEFAULT 1,criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,INDEX idx_ficha_produto(produto_id)) ENGINE=InnoDB`,
 `CREATE TABLE IF NOT EXISTS ficha_producao_itens (id INT AUTO_INCREMENT PRIMARY KEY,ficha_id INT NOT NULL,material_id INT NOT NULL,quantidade DECIMAL(12,3) NOT NULL,unidade_consumo VARCHAR(20) NULL,UNIQUE KEY uq_ficha_material(ficha_id,material_id),INDEX idx_fpi_ficha(ficha_id),INDEX idx_fpi_material(material_id)) ENGINE=InnoDB`,
 `CREATE TABLE IF NOT EXISTS producoes (id BIGINT AUTO_INCREMENT PRIMARY KEY,produto_id INT NOT NULL,usuario_id INT NULL,quantidade DECIMAL(12,3) NOT NULL,data_producao DATE NOT NULL,observacao TEXT NULL,criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,INDEX idx_prod_data(data_producao),INDEX idx_prod_produto(produto_id)) ENGINE=InnoDB`,
 ];
 for(const s of stmts) await pool.query(s);
 const add={
  produtos:[['estoque_categoria',"VARCHAR(20) NOT NULL DEFAULT 'INTERNO'"],['tipo',"VARCHAR(80) NOT NULL DEFAULT 'Material'"],['unidade',"VARCHAR(20) NOT NULL DEFAULT 'un'"],['categoria_id','INT NULL'],['fornecedor_id','INT NULL'],['ativo','TINYINT(1) NOT NULL DEFAULT 1'],['criado_em',"DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP"]],
  categorias:[['estoque_categoria',"VARCHAR(20) NOT NULL DEFAULT 'INTERNO'"],['ativo','TINYINT(1) NOT NULL DEFAULT 1'],['criado_em','DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP']],
  fornecedores:[['cnpj','VARCHAR(30) NULL'],['contato','VARCHAR(120) NULL'],['endereco','VARCHAR(255) NULL'],['cidade','VARCHAR(120) NULL'],['estado','VARCHAR(2) NULL'],['observacao','TEXT NULL'],['ativo','TINYINT(1) NOT NULL DEFAULT 1'],['criado_em','DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP']],
  usuarios:[['senha',"VARCHAR(255) NOT NULL DEFAULT '1234'"],['role',"VARCHAR(30) NOT NULL DEFAULT 'FUNCIONARIO'"],['ativo','TINYINT(1) NOT NULL DEFAULT 1'],['criado_em','DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP']],
  ficha_producao_itens:[['unidade_consumo','VARCHAR(20) NULL']],
  movimentacoes:[['fornecedor_id','INT NULL'],['documento','VARCHAR(120) NULL'],['motivo','VARCHAR(120) NULL'],['destino','VARCHAR(180) NULL'],['observacao','TEXT NULL'],['data_movimentacao','DATE NULL'],['criado_em','DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP']]
 };
 for(const [table,defs] of Object.entries(add)){const cols=await columns(table);for(const [name,type] of defs){if(!cols.has(name)){try{await pool.query(`ALTER TABLE ${q(table)} ADD COLUMN ${q(name)} ${type}`);cols.add(name)}catch(e){console.warn(`Não foi possível adicionar ${table}.${name}:`,e.message)}}}}
 // seed admin only if table is empty
 const [cnt]=await pool.query('SELECT COUNT(*) AS total FROM usuarios');
 if(Number(cnt[0].total)===0){const hash=await bcrypt.hash('1234',10);await pool.query(`INSERT INTO usuarios (nome,email,senha,role,ativo) VALUES (?,?,?,?,1)`,['Administrador','admin@estoque.local',hash,'ADMIN']);}else{const [adminRows]=await pool.query('SELECT id,senha FROM usuarios WHERE LOWER(email)=LOWER(?) LIMIT 1',['admin@estoque.local']);if(adminRows.length&&!String(adminRows[0].senha).startsWith('$2')){const hash=await bcrypt.hash(String(adminRows[0].senha||'1234'),10);await pool.query('UPDATE usuarios SET senha=? WHERE id=?',[hash,adminRows[0].id]);}}
}
app.get('/',(req,res)=>res.json({message:'API ToolStock funcionando!'}));
app.get('/api/teste-db',async(req,res)=>{try{const [rows]=await pool.query('SELECT 1 AS conectado');res.json({sucesso:true,banco:'MySQL conectado!',resultado:rows[0]})}catch(e){res.status(500).json({sucesso:false,erro:e.message})}});

function productSelect(){return `SELECT p.id,p.nome,p.estoque_categoria AS stockCategory,p.tipo,p.unidade,p.marca,p.modelo,p.estoque,p.estoque_minimo,p.preco_custo,p.preco_venda,p.ativo,p.categoria_id,c.nome AS categoria FROM produtos p LEFT JOIN categorias c ON c.id=p.categoria_id`;}
app.get('/api/produtos',async(req,res)=>{try{const [rows]=await pool.query(productSelect()+' ORDER BY p.id DESC');res.json(rows);}catch(e){res.status(500).json({sucesso:false,erro:'Erro ao buscar produtos.',detalhes:e.message});}});
app.get('/api/produtos/:id',async(req,res)=>{try{const [rows]=await pool.query(productSelect()+' WHERE p.id=?',[req.params.id]);if(!rows.length)return res.status(404).json({erro:'Produto não encontrado.'});res.json(rows[0]);}catch(e){res.status(500).json({erro:e.message});}});
app.post('/api/produtos',async(req,res)=>{try{const d=req.body;if(!String(d.nome||'').trim())return res.status(400).json({erro:'O nome do produto é obrigatório.'});const cat=Number(d.categoria_id||0);if(!cat)return res.status(400).json({erro:'Selecione uma categoria cadastrada.'});const stockCategory=String(d.stockCategory||d.stock_category||'internal').toLowerCase()==='sale'?'VENDA':'INTERNO';const [catRows]=await pool.query('SELECT id FROM categorias WHERE id=? AND ativo=1 AND estoque_categoria=?',[cat,stockCategory]);if(!catRows.length)return res.status(400).json({erro:'Categoria não encontrada, inativa ou incompatível com o destino do estoque.'});const [r]=await pool.query(`INSERT INTO produtos (estoque_categoria,nome,tipo,unidade,marca,modelo,estoque,estoque_minimo,preco_custo,preco_venda,categoria_id,ativo) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,[stockCategory,d.nome.trim(),d.tipo||'Material',d.unidade||'un',d.marca||null,d.modelo||null,Number(d.estoque??0),Number(d.estoque_minimo??0),Number(d.preco_custo??0),stockCategory==='VENDA'?Number(d.preco_venda??0):0,d.categoria_id,d.ativo===false?0:1]);const [rows]=await pool.query(productSelect()+' WHERE p.id=?',[r.insertId]);res.status(201).json({sucesso:true,produto:rows[0]});}catch(e){res.status(500).json({sucesso:false,erro:'Erro ao cadastrar produto.',detalhes:e.message});}});
app.put('/api/produtos/:id',async(req,res)=>{try{const d=req.body;const [exists]=await pool.query('SELECT id FROM produtos WHERE id=?',[req.params.id]);if(!exists.length)return res.status(404).json({erro:'Produto não encontrado.'});const cat=Number(d.categoria_id||0);if(!cat)return res.status(400).json({erro:'Selecione uma categoria cadastrada.'});const stockCategory=String(d.stockCategory||d.stock_category||'internal').toLowerCase()==='sale'?'VENDA':'INTERNO';const [catRows]=await pool.query('SELECT id FROM categorias WHERE id=? AND ativo=1 AND estoque_categoria=?',[cat,stockCategory]);if(!catRows.length)return res.status(400).json({erro:'Categoria não encontrada, inativa ou incompatível com o destino do estoque.'});await pool.query(`UPDATE produtos SET estoque_categoria=?,nome=?,tipo=?,unidade=?,marca=?,modelo=?,estoque=?,estoque_minimo=?,preco_custo=?,preco_venda=?,categoria_id=?,ativo=? WHERE id=?`,[stockCategory,d.nome?.trim()||'',d.tipo||'Material',d.unidade||'un',d.marca||null,d.modelo||null,Number(d.estoque??0),Number(d.estoque_minimo??0),Number(d.preco_custo??0),stockCategory==='VENDA'?Number(d.preco_venda??0):0,d.categoria_id,d.ativo===false?0:1,req.params.id]);const [rows]=await pool.query(productSelect()+' WHERE p.id=?',[req.params.id]);res.json({sucesso:true,produto:rows[0]});}catch(e){res.status(500).json({erro:e.message});}});
app.delete('/api/produtos/:id',async(req,res)=>{try{const [m]=await pool.query('SELECT COUNT(*) AS total FROM movimentacoes WHERE produto_id=?',[req.params.id]);if(Number(m[0].total)>0)return res.status(409).json({erro:'Não é possível excluir um produto que possui movimentações. Inative o produto em vez de excluir.'});const [r]=await pool.query('DELETE FROM produtos WHERE id=?',[req.params.id]);if(!r.affectedRows)return res.status(404).json({erro:'Produto não encontrado.'});res.json({sucesso:true});}catch(e){res.status(500).json({erro:e.message});}});

app.get('/api/categorias',async(req,res)=>{try{const [rows]=await pool.query(`SELECT id,nome AS name,descricao AS description,estoque_categoria AS stockCategory,ativo,criado_em AS createdAt FROM categorias ORDER BY nome`);res.json(rows)}catch(e){res.status(500).json({erro:e.message})}});
app.post('/api/categorias',async(req,res)=>{try{const name=String(req.body.name||'').trim();if(!name)return res.status(400).json({erro:'Informe o nome da categoria.'});const [dup]=await pool.query('SELECT id FROM categorias WHERE LOWER(nome)=LOWER(?)',[name]);if(dup.length)return res.status(409).json({erro:'Já existe uma categoria com esse nome.'});const [r]=await pool.query('INSERT INTO categorias (nome,descricao,estoque_categoria,ativo) VALUES (?,?,?,1)',[name,req.body.description||null,req.body.stockCategory==='sale'?'VENDA':'INTERNO']);const [rows]=await pool.query('SELECT id,nome AS name,descricao AS description,estoque_categoria AS stockCategory,ativo,criado_em AS createdAt FROM categorias WHERE id=?',[r.insertId]);res.status(201).json(rows[0])}catch(e){res.status(500).json({erro:e.message})}});
app.put('/api/categorias/:id',async(req,res)=>{try{const name=String(req.body.name||'').trim();if(!name)return res.status(400).json({erro:'Informe o nome da categoria.'});const nextStockCategory=req.body.stockCategory==='sale'?'VENDA':'INTERNO';const [current]=await pool.query('SELECT id,estoque_categoria AS stockCategory FROM categorias WHERE id=?',[req.params.id]);if(!current.length)return res.status(404).json({erro:'Categoria não encontrada.'});if(String(current[0].stockCategory).toUpperCase()!==nextStockCategory){const [used]=await pool.query('SELECT COUNT(*) AS total FROM produtos WHERE categoria_id=?',[req.params.id]);if(Number(used[0].total)>0)return res.status(409).json({erro:'Não altere o destino de uma categoria que já possui produtos. Crie outra categoria para o novo estoque.'});}const [dup]=await pool.query('SELECT id FROM categorias WHERE LOWER(nome)=LOWER(?) AND id<>?',[name,req.params.id]);if(dup.length)return res.status(409).json({erro:'Já existe outra categoria com esse nome.'});const [r]=await pool.query('UPDATE categorias SET nome=?,descricao=?,estoque_categoria=? WHERE id=?',[name,req.body.description||null,nextStockCategory,req.params.id]);if(!r.affectedRows)return res.status(404).json({erro:'Categoria não encontrada.'});const [rows]=await pool.query('SELECT id,nome AS name,descricao AS description,estoque_categoria AS stockCategory,ativo,criado_em AS createdAt FROM categorias WHERE id=?',[req.params.id]);res.json(rows[0])}catch(e){res.status(500).json({erro:e.message})}});
app.delete('/api/categorias/:id',async(req,res)=>{try{const [p]=await pool.query('SELECT COUNT(*) AS total FROM produtos WHERE categoria_id=?',[req.params.id]);if(Number(p[0].total)>0)return res.status(409).json({erro:'Não é possível excluir uma categoria utilizada por produtos.'});const [r]=await pool.query('DELETE FROM categorias WHERE id=?',[req.params.id]);if(!r.affectedRows)return res.status(404).json({erro:'Categoria não encontrada.'});res.json({sucesso:true})}catch(e){res.status(500).json({erro:e.message})}});

app.get('/api/fornecedores',async(req,res)=>{try{const [rows]=await pool.query(`SELECT id,nome AS name,cnpj AS document,email,telefone AS phone,contato AS contact,endereco AS address,cidade AS city,estado AS state,observacao AS notes,ativo AS active,criado_em AS createdAt FROM fornecedores ORDER BY nome`);res.json(rows)}catch(e){res.status(500).json({erro:e.message})}});
app.post('/api/fornecedores',async(req,res)=>{try{const name=String(req.body.name||'').trim();if(!name)return res.status(400).json({erro:'Informe o nome do fornecedor.'});const [dup]=await pool.query('SELECT id FROM fornecedores WHERE LOWER(nome)=LOWER(?)',[name]);if(dup.length)return res.status(409).json({erro:'Já existe um fornecedor com esse nome.'});const [r]=await pool.query('INSERT INTO fornecedores (nome,cnpj,email,telefone,contato,endereco,cidade,estado,observacao,ativo) VALUES (?,?,?,?,?,?,?,?,?,?)',[name,req.body.document||null,req.body.email||null,req.body.phone||null,req.body.contact||null,req.body.address||null,req.body.city||null,req.body.state||null,req.body.notes||null,req.body.active===false?0:1]);const [rows]=await pool.query('SELECT id,nome AS name,cnpj AS document,email,telefone AS phone,contato AS contact,endereco AS address,cidade AS city,estado AS state,observacao AS notes,ativo AS active,criado_em AS createdAt FROM fornecedores WHERE id=?',[r.insertId]);res.status(201).json(rows[0])}catch(e){res.status(500).json({erro:e.message})}});
app.put('/api/fornecedores/:id',async(req,res)=>{try{const name=String(req.body.name||'').trim();if(!name)return res.status(400).json({erro:'Informe o nome do fornecedor.'});const [dup]=await pool.query('SELECT id FROM fornecedores WHERE LOWER(nome)=LOWER(?) AND id<>?',[name,req.params.id]);if(dup.length)return res.status(409).json({erro:'Já existe outro fornecedor com esse nome.'});const [r]=await pool.query('UPDATE fornecedores SET nome=?,cnpj=?,email=?,telefone=?,contato=?,endereco=?,cidade=?,estado=?,observacao=?,ativo=? WHERE id=?',[name,req.body.document||null,req.body.email||null,req.body.phone||null,req.body.contact||null,req.body.address||null,req.body.city||null,req.body.state||null,req.body.notes||null,req.body.active===false?0:1,req.params.id]);if(!r.affectedRows)return res.status(404).json({erro:'Fornecedor não encontrado.'});const [rows]=await pool.query('SELECT id,nome AS name,cnpj AS document,email,telefone AS phone,contato AS contact,endereco AS address,cidade AS city,estado AS state,observacao AS notes,ativo AS active,criado_em AS createdAt FROM fornecedores WHERE id=?',[req.params.id]);res.json(rows[0])}catch(e){res.status(500).json({erro:e.message})}});
app.delete('/api/fornecedores/:id',async(req,res)=>{try{const [p]=await pool.query('SELECT COUNT(*) AS total FROM produtos WHERE fornecedor_id=?',[req.params.id]);if(Number(p[0].total)>0)return res.status(409).json({erro:'Não é possível excluir um fornecedor utilizado por produtos.'});const [r]=await pool.query('DELETE FROM fornecedores WHERE id=?',[req.params.id]);if(!r.affectedRows)return res.status(404).json({erro:'Fornecedor não encontrado.'});res.json({sucesso:true})}catch(e){res.status(500).json({erro:e.message})}});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({
        erro: 'Informe o e-mail e a senha.'
      });
    }

    const [rows] = await pool.query(
      `SELECT
        id,
        nome AS name,
        email,
        senha AS password,
        role,
        ativo AS active,
        criado_em AS createdAt
       FROM usuarios
       WHERE LOWER(email) = LOWER(?)
       LIMIT 1`,
      [email]
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({
        erro: 'E-mail ou senha inválidos.'
      });
    }

    const senhaCorreta = await bcrypt.compare(
      password,
      user.password
    );

    if (!senhaCorreta) {
      return res.status(401).json({
        erro: 'E-mail ou senha inválidos.'
      });
    }

    if (!user.active) {
      return res.status(403).json({
        erro: 'Este usuário está inativo.'
      });
    }

    delete user.password;

    res.json(user);

  } catch (e) {
    console.error('Erro no login:', e);

    res.status(500).json({
      erro: e.message
    });
  }
});app.get('/api/usuarios',async(req,res)=>{try{const [rows]=await pool.query('SELECT id,nome AS name,email,role,ativo AS active,criado_em AS createdAt FROM usuarios ORDER BY nome');res.json(rows)}catch(e){res.status(500).json({erro:e.message})}});
app.post('/api/usuarios',async(req,res)=>{try{const name=String(req.body.name||'').trim(),email=String(req.body.email||'').trim().toLowerCase(),password=String(req.body.password||'');if(!name)return res.status(400).json({erro:'Informe o nome do usuário.'});if(!email.includes('@'))return res.status(400).json({erro:'Informe um e-mail válido.'});if(password.length<4)return res.status(400).json({erro:'A senha deve ter pelo menos 4 caracteres.'});const role=String(req.body.role||'FUNCIONARIO').toUpperCase();if(!['ADMIN','GERENTE','FUNCIONARIO'].includes(role))return res.status(400).json({erro:'Nível de acesso inválido.'});const [dup]=await pool.query('SELECT id FROM usuarios WHERE LOWER(email)=LOWER(?)',[email]);if(dup.length)return res.status(409).json({erro:'Já existe um usuário com esse e-mail.'});const hashed=await bcrypt.hash(password,10);const [r]=await pool.query('INSERT INTO usuarios (nome,email,senha,role,ativo) VALUES (?,?,?,?,?)',[name,email,hashed,role,req.body.active===false?0:1]);const [rows]=await pool.query('SELECT id,nome AS name,email,role,ativo AS active,criado_em AS createdAt FROM usuarios WHERE id=?',[r.insertId]);res.status(201).json(rows[0])}catch(e){res.status(500).json({erro:e.message})}});
app.put('/api/usuarios/:id',async(req,res)=>{try{const [curRows]=await pool.query('SELECT id,nome AS name,email,senha AS password,role,ativo AS active,criado_em AS createdAt FROM usuarios WHERE id=?',[req.params.id]);if(!curRows.length)return res.status(404).json({erro:'Usuário não encontrado.'});const cur=curRows[0];const name=String(req.body.name||'').trim(),email=String(req.body.email||'').trim().toLowerCase();if(!name||!email.includes('@'))return res.status(400).json({erro:'Nome e e-mail são obrigatórios.'});const nextRole=String(req.body.role||cur.role).toUpperCase();if(!['ADMIN','GERENTE','FUNCIONARIO'].includes(nextRole))return res.status(400).json({erro:'Nível de acesso inválido.'});if(email!==cur.email){const [dup]=await pool.query('SELECT id FROM usuarios WHERE LOWER(email)=LOWER(?) AND id<>?',[email,req.params.id]);if(dup.length)return res.status(409).json({erro:'Já existe outro usuário com esse e-mail.'})}const nextActive=req.body.active!==false;if(cur.role==='ADMIN'&&cur.active&&!(nextRole==='ADMIN'&&nextActive)){const [a]=await pool.query("SELECT COUNT(*) AS total FROM usuarios WHERE role='ADMIN' AND ativo=1 AND id<>?",[req.params.id]);if(Number(a[0].total)===0)return res.status(409).json({erro:'Não é possível remover ou inativar o último administrador ativo.'})}const password=req.body.password!==undefined?String(req.body.password):'';if(req.body.password!==undefined&&password!==''&&password.length<4)return res.status(400).json({erro:'A senha deve ter pelo menos 4 caracteres.'});const hashedPassword=password?await bcrypt.hash(password,10):cur.password;await pool.query('UPDATE usuarios SET nome=?,email=?,senha=?,role=?,ativo=? WHERE id=?',[name,email,hashedPassword,nextRole,nextActive?1:0,req.params.id]);const [rows]=await pool.query('SELECT id,nome AS name,email,role,ativo AS active,criado_em AS createdAt FROM usuarios WHERE id=?',[req.params.id]);res.json(rows[0])}catch(e){res.status(500).json({erro:e.message})}});
app.delete('/api/usuarios/:id',async(req,res)=>{try{const requesterId=Number(req.body?.requesterId||req.body?.usuario_id||req.query?.requesterId||0);if(!requesterId)return res.status(403).json({erro:'Identifique o usuário que está realizando a operação.'});const [requesterRows]=await pool.query('SELECT id,role,ativo FROM usuarios WHERE id=?',[requesterId]);if(!requesterRows.length||!requesterRows[0].ativo)return res.status(403).json({erro:'Usuário responsável não autorizado.'});const requester=requesterRows[0];const [targetRows]=await pool.query('SELECT id,role,ativo FROM usuarios WHERE id=?',[req.params.id]);if(!targetRows.length)return res.status(404).json({erro:'Usuário não encontrado.'});const target=targetRows[0];if(requester.id===target.id)return res.status(409).json({erro:'Você não pode excluir seu próprio usuário.'});const rank={FUNCIONARIO:1,GERENTE:2,ADMIN:3};const requesterRank=rank[String(requester.role).toUpperCase()]||0;const targetRank=rank[String(target.role).toUpperCase()]||0;if(requesterRank<=targetRank)return res.status(403).json({erro:'Você só pode excluir usuários de nível inferior ao seu.'});if(target.role==='ADMIN'&&target.ativo){return res.status(403).json({erro:'Um administrador só pode ser excluído por um nível superior.'})}if(target.role==='ADMIN'){const [a]=await pool.query("SELECT COUNT(*) AS total FROM usuarios WHERE role='ADMIN' AND ativo=1");if(Number(a[0].total)<=1)return res.status(409).json({erro:'Não é possível excluir o último administrador ativo.'})}await pool.query('DELETE FROM usuarios WHERE id=?',[req.params.id]);res.json({sucesso:true})}catch(e){res.status(500).json({erro:e.message})}});

app.get('/api/movimentacoes',async(req,res)=>{try{const type=req.query.type;let sql=`SELECT m.id,m.tipo AS type,m.produto_id AS productId,p.nome AS productName,p.estoque_categoria AS stockCategory,p.unidade AS unit,m.quantidade AS quantity,m.estoque_anterior AS previousStock,m.estoque_posterior AS newStock,m.documento AS document,m.motivo AS reason,m.destino AS destination,m.observacao AS notes,COALESCE(m.data_movimentacao,DATE(m.criado_em)) AS movementDate,m.criado_em AS createdAt,COALESCE(u.nome,'Administrador') AS userName FROM movimentacoes m JOIN produtos p ON p.id=m.produto_id LEFT JOIN usuarios u ON u.id=m.usuario_id`;const params=[];if(type){sql+=' WHERE m.tipo=?';params.push(type);}sql+=' ORDER BY m.criado_em DESC,m.id DESC';const [rows]=await pool.query(sql,params);res.json(rows);}catch(e){res.status(500).json({erro:e.message,detalhes:e.message});}});

async function createMovement(req,res,type){const c=await pool.getConnection();try{const d=req.body, productId=Number(d.productId??d.produto_id), qty=Number(d.quantity??d.quantidade);if(!productId)return res.status(400).json({erro:'Selecione um produto.'});if(!Number.isFinite(qty)||qty<=0)return res.status(400).json({erro:'Informe uma quantidade maior que zero.'});if(type==='SAIDA'&&!String(d.reason||'').trim())return res.status(400).json({erro:'Informe o motivo da saída.'});await c.beginTransaction();const [ps]=await c.query('SELECT id,estoque FROM produtos WHERE id=? FOR UPDATE',[productId]);if(!ps.length)throw new Error('Produto não encontrado.');const prev=Number(ps[0].estoque||0);if(type==='SAIDA'&&qty>prev)throw new Error(`Estoque insuficiente. Existem apenas ${prev} unidades disponíveis.`);const next=type==='ENTRADA'?prev+qty:prev-qty;await c.query('UPDATE produtos SET estoque=? WHERE id=?',[next,productId]);const [r]=await c.query(`INSERT INTO movimentacoes (produto_id,usuario_id,tipo,quantidade,estoque_anterior,estoque_posterior,documento,motivo,destino,observacao,data_movimentacao) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,[productId,d.usuario_id||1,type,qty,prev,next,d.document||null,d.reason||null,d.destination||null,d.notes||null,d.movementDate||null]);await c.commit();const [rows]=await pool.query(`SELECT m.id,m.tipo AS type,m.produto_id AS productId,p.nome AS productName,p.estoque_categoria AS stockCategory,p.unidade AS unit,m.quantidade AS quantity,m.estoque_anterior AS previousStock,m.estoque_posterior AS newStock,m.documento AS document,m.motivo AS reason,m.destino AS destination,m.observacao AS notes,COALESCE(m.data_movimentacao,DATE(m.criado_em)) AS movementDate,m.criado_em AS createdAt,COALESCE(u.nome,'Administrador') AS userName FROM movimentacoes m JOIN produtos p ON p.id=m.produto_id LEFT JOIN usuarios u ON u.id=m.usuario_id WHERE m.id=?`,[r.insertId]);res.status(201).json(rows[0])}catch(e){await c.rollback();res.status(400).json({erro:e.message})}finally{c.release()}}
app.post('/api/movimentacoes/entrada',(req,res)=>createMovement(req,res,'ENTRADA'));
app.post('/api/movimentacoes/saida',(req,res)=>createMovement(req,res,'SAIDA'));



/* =========================================================
   PRODUÇÃO / FICHAS TÉCNICAS
   ========================================================= */

const UNIT_FACTORS = {
  un: { family: 'count', factor: 1 },
  g: { family: 'mass', factor: 0.001 },
  kg: { family: 'mass', factor: 1 },
  ml: { family: 'volume', factor: 0.001 },
  l: { family: 'volume', factor: 1 },
  cm: { family: 'length', factor: 0.01 },
  m: { family: 'length', factor: 1 },
};

function normalizeUnit(value) {
  const unit = String(value || 'un').trim().toLowerCase();
  return UNIT_FACTORS[unit] ? unit : 'un';
}

function convertQuantity(quantity, fromUnit, toUnit) {
  const from = UNIT_FACTORS[normalizeUnit(fromUnit)];
  const to = UNIT_FACTORS[normalizeUnit(toUnit)];
  if (!from || !to || from.family !== to.family) return null;
  return Number(quantity) * from.factor / to.factor;
}

function compatibleUnits(stockUnit) {
  const base = UNIT_FACTORS[normalizeUnit(stockUnit)];
  if (!base) return ['un'];
  return Object.entries(UNIT_FACTORS)
    .filter(([, value]) => value.family === base.family)
    .map(([unit]) => unit);
}

const productionSelect = `
  SELECT
    f.id,
    f.produto_id AS productId,
    p.nome AS productName,
    p.unidade AS unit,
    p.estoque AS stock,
    p.estoque_categoria AS stockCategory,
    f.ativo AS active,
    f.criado_em AS createdAt,
    f.atualizado_em AS updatedAt
  FROM fichas_producao f
  JOIN produtos p ON p.id = f.produto_id
`;

async function getRecipeItems(db, fichaId) {
  const [items] = await db.query(`
    SELECT
      i.id,
      i.material_id AS materialId,
      p.nome AS materialName,
      p.unidade AS unit,
      p.estoque AS stock,
      p.estoque_categoria AS stockCategory,
      i.quantidade AS quantity,
      COALESCE(i.unidade_consumo, p.unidade) AS consumptionUnit
    FROM ficha_producao_itens i
    JOIN produtos p ON p.id = i.material_id
    WHERE i.ficha_id=?
    ORDER BY p.nome
  `, [fichaId]);
  return items.map((item) => ({
    ...item,
    displayQuantity: (() => {
      const value = convertQuantity(Number(item.quantity), item.unit, item.consumptionUnit);
      return value === null ? Number(item.quantity) : value;
    })(),
  }));
}

app.get('/api/producao/fichas', async (req, res) => {
  try {
    const [rows] = await pool.query(productionSelect + ' WHERE f.ativo=1 AND p.ativo=1 ORDER BY p.nome');
    for (const row of rows) row.items = await getRecipeItems(pool, row.id);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.get('/api/producao/fichas/:productId', async (req, res) => {
  try {
    const [rows] = await pool.query(productionSelect + ' WHERE f.produto_id=? AND f.ativo=1 LIMIT 1', [req.params.productId]);
    if (!rows.length) return res.status(404).json({ erro: 'Ficha de produção não encontrada.' });
    rows[0].items = await getRecipeItems(pool, rows[0].id);
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.post('/api/producao/fichas', async (req, res) => {
  const c = await pool.getConnection();
  try {
    const productId = Number(req.body.productId);
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (!productId) return res.status(400).json({ erro: 'Selecione o produto que será produzido.' });
    if (!items.length) return res.status(400).json({ erro: 'Adicione pelo menos um material à ficha.' });

    await c.beginTransaction();
    const [finishedRows] = await c.query('SELECT id,nome,estoque_categoria,ativo FROM produtos WHERE id=? FOR UPDATE', [productId]);
    if (!finishedRows.length || !finishedRows[0].ativo) throw new Error('Produto produzido não encontrado ou inativo.');
    if (String(finishedRows[0].estoque_categoria).toUpperCase() !== 'VENDA') throw new Error('A ficha de produção deve estar vinculada a um produto destinado à venda.');

    const clean = items.map(item => ({
      materialId: Number(item.materialId),
      quantity: Number(String(item.quantity ?? '').replace(',', '.')),
      consumptionUnit: normalizeUnit(item.consumptionUnit || item.unit || 'un'),
    })).filter(item => item.materialId && Number.isFinite(item.quantity) && item.quantity > 0);

    const unique = new Set(clean.map(item => item.materialId));
    if (clean.length !== unique.size) throw new Error('O mesmo material não pode aparecer duas vezes na ficha.');
    if (clean.some(item => item.materialId === productId)) throw new Error('O produto produzido não pode ser usado como seu próprio material.');

    const normalizedItems = [];
    for (const item of clean) {
      const [matRows] = await c.query('SELECT id,nome,unidade,estoque_categoria,ativo FROM produtos WHERE id=? FOR UPDATE', [item.materialId]);
      if (!matRows.length || !matRows[0].ativo) throw new Error('Um dos materiais selecionados não existe ou está inativo.');
      if (String(matRows[0].estoque_categoria).toUpperCase() !== 'INTERNO') throw new Error(`"${matRows[0].nome}" não é um material de uso interno.`);
      const converted = convertQuantity(item.quantity, item.consumptionUnit, matRows[0].unidade);
      if (converted === null) throw new Error(`A unidade ${item.consumptionUnit} não é compatível com ${matRows[0].unidade} para "${matRows[0].nome}".`);
      normalizedItems.push({ ...item, quantityBase: converted, materialName: matRows[0].nome, stockUnit: matRows[0].unidade });
    }

    const [existing] = await c.query('SELECT id FROM fichas_producao WHERE produto_id=? FOR UPDATE', [productId]);
    let fichaId;
    if (existing.length) {
      fichaId = existing[0].id;
      await c.query('UPDATE fichas_producao SET ativo=1 WHERE id=?', [fichaId]);
      await c.query('DELETE FROM ficha_producao_itens WHERE ficha_id=?', [fichaId]);
    } else {
      const [r] = await c.query('INSERT INTO fichas_producao (produto_id,ativo) VALUES (?,1)', [productId]);
      fichaId = r.insertId;
    }

    for (const item of normalizedItems) {
      await c.query(
        'INSERT INTO ficha_producao_itens (ficha_id,material_id,quantidade,unidade_consumo) VALUES (?,?,?,?)',
        [fichaId, item.materialId, item.quantityBase, item.consumptionUnit]
      );
    }

    await c.commit();
    const [rows] = await pool.query(productionSelect + ' WHERE f.id=?', [fichaId]);
    rows[0].items = await getRecipeItems(pool, fichaId);
    res.status(201).json(rows[0]);
  } catch (e) {
    await c.rollback();
    res.status(400).json({ erro: e.message });
  } finally { c.release(); }
});

app.delete('/api/producao/fichas/:productId', async (req, res) => {
  try {
    const [r] = await pool.query('DELETE FROM fichas_producao WHERE produto_id=?', [req.params.productId]);
    if (!r.affectedRows) return res.status(404).json({ erro: 'Ficha de produção não encontrada.' });
    res.json({ sucesso: true });
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.get('/api/producao/historico', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT pr.id,pr.produto_id AS productId,p.nome AS productName,p.unidade AS unit,p.estoque_categoria AS stockCategory,
             pr.quantidade AS quantity,pr.data_producao AS productionDate,pr.observacao AS notes,pr.criado_em AS createdAt,
             COALESCE(u.nome,'Administrador') AS userName
      FROM producoes pr JOIN produtos p ON p.id=pr.produto_id LEFT JOIN usuarios u ON u.id=pr.usuario_id
      ORDER BY pr.data_producao DESC,pr.id DESC
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.post('/api/producao/registrar', async (req, res) => {
  const c = await pool.getConnection();
  try {
    const productId = Number(req.body.productId);
    const quantity = Number(String(req.body.quantity ?? '').replace(',', '.'));
    const userId = Number(req.body.usuario_id || 1);
    const date = String(req.body.productionDate || '').slice(0, 10);
    const notes = String(req.body.notes || '').trim() || null;
    if (!productId) return res.status(400).json({ erro: 'Selecione o produto produzido.' });
    if (!Number.isFinite(quantity) || quantity <= 0) return res.status(400).json({ erro: 'Informe uma quantidade produzida maior que zero.' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ erro: 'Informe uma data de produção válida.' });

    await c.beginTransaction();
    const [fRows] = await c.query('SELECT id FROM fichas_producao WHERE produto_id=? AND ativo=1 FOR UPDATE', [productId]);
    if (!fRows.length) throw new Error('Cadastre a ficha de produção deste produto antes de registrar a produção.');
    const fichaId = fRows[0].id;
    const [finishedRows] = await c.query('SELECT id,nome,estoque,estoque_categoria,unidade,preco_custo,ativo FROM produtos WHERE id=? FOR UPDATE', [productId]);
    if (!finishedRows.length || !finishedRows[0].ativo) throw new Error('Produto produzido não encontrado ou inativo.');
    if (String(finishedRows[0].estoque_categoria).toUpperCase() !== 'VENDA') throw new Error('Somente produtos destinados à venda podem ser registrados como produção.');

    const items = await getRecipeItems(c, fichaId);
    if (!items.length) throw new Error('A ficha de produção não possui materiais.');
    const requirements = items.map(item => ({ ...item, required: Number(item.quantity) * quantity }));
    const insufficient = requirements.find(item => String(item.stockCategory).toUpperCase() !== 'INTERNO' || !Number.isFinite(Number(item.stock)) || Number(item.stock) < item.required);
    if (insufficient) throw new Error(`Estoque insuficiente para ${insufficient.materialName}. Necessário ${insufficient.required} ${insufficient.unit}; disponível ${insufficient.stock} ${insufficient.unit}.`);

    const finishedPrevious = Number(finishedRows[0].estoque);
    const finishedNext = finishedPrevious + quantity;
    const [production] = await c.query('INSERT INTO producoes (produto_id,usuario_id,quantidade,data_producao,observacao) VALUES (?,?,?,?,?)',[productId,userId,quantity,date,notes]);
    const productionDocument = `PROD-${production.insertId}`;

    const movementIds = [];
    for (const item of requirements) {
      const previous = Number(item.stock);
      const next = previous - item.required;
      await c.query('UPDATE produtos SET estoque=? WHERE id=?', [next, item.materialId]);
      const [mr] = await c.query(
        `INSERT INTO movimentacoes (produto_id,usuario_id,tipo,quantidade,estoque_anterior,estoque_posterior,documento,motivo,observacao,data_movimentacao) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [item.materialId,userId,'SAIDA',item.required,previous,next,productionDocument,'Produção',notes,date]
      );
      movementIds.push(mr.insertId);
    }

    await c.query('UPDATE produtos SET estoque=? WHERE id=?', [finishedNext, productId]);
    const [finishedMovement] = await c.query(
      `INSERT INTO movimentacoes (produto_id,usuario_id,tipo,quantidade,estoque_anterior,estoque_posterior,documento,motivo,observacao,data_movimentacao) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [productId,userId,'ENTRADA',quantity,finishedPrevious,finishedNext,productionDocument,'Produção',notes,date]
    );

    await c.commit();
    res.status(201).json({
      sucesso:true, productionId:production.insertId, document:productionDocument, productId, quantity, date,
      finishedPrevious, finishedNext,
      consumed:requirements.map(item=>({materialId:item.materialId,name:item.materialName,quantity:item.required,unit:item.unit,previousStock:Number(item.stock),newStock:Number(item.stock)-item.required})),
      finishedMovementId:finishedMovement.insertId, movementIds
    });
  } catch (e) {
    await c.rollback();
    res.status(400).json({ erro: e.message });
  } finally { c.release(); }
});

async function start(){try{await pool.query('SELECT 1');await ensureSchema();const [p]=await pool.query('SELECT COUNT(*) AS total FROM produtos');console.log(`📦 Produtos no banco: ${p[0].total}`);console.log('🗄️ Banco pronto.');const PORT=process.env.PORT||3001;app.listen(PORT,()=>console.log(`🚀 API rodando em http://localhost:${PORT}`))}catch(e){console.error('❌ Falha ao iniciar API:',e);process.exit(1)}}
start();
