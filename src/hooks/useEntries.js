import { useCallback, useEffect, useState } from "react";
import { movementsService } from "../services/movementsService";
import { productsService } from "../services/productsService";
export function useEntries() {
  const [entries,setEntries]=useState([]),[products,setProducts]=useState([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const load=useCallback(async()=>{setLoading(true);setError("");try{const [entriesData,productsData]=await Promise.all([movementsService.list("ENTRADA"),productsService.list()]);setEntries(entriesData);setProducts(productsData);}catch(err){console.error(err);setError("Não foi possível carregar as entradas.");}finally{setLoading(false);}},[]);
  const createEntry=async(data)=>{setBusy(true);setError("");try{const entry=await movementsService.createEntry(data);await load();return entry;}catch(err){setError(err.message||"Não foi possível registrar a entrada.");throw err;}finally{setBusy(false);}};
  useEffect(()=>{load();},[load]); return {entries,products,loading,busy,error,reload:load,createEntry};
}
