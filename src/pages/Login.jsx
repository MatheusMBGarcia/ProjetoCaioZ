import {
  useState,
} from "react";

import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Zap,
} from "lucide-react";

import { authService } from "../services/authService";

export default function Login({
  onLogin,
}) {
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const user =
        await authService.login(
          email,
          password
        );

      onLogin(user);
    } catch (err) {
      setError(
        err.message ||
          "Não foi possível entrar."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background:
          "var(--bg)",
      }}
    >

      <form
        className="panel"
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "430px",
          padding: "32px",
        }}
      >

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "28px",
          }}
        >

          <div className="logo">
            <Zap size={22} />
          </div>

          <div>
            <h2
              style={{
                margin: 0,
              }}
            >
              ToolStock
            </h2>

            <p
              className="muted"
              style={{
                margin:
                  "4px 0 0",
              }}
            >
              Gestão de estoque
            </p>
          </div>

        </div>

        <div
          style={{
            marginBottom: "26px",
          }}
        >
          <p className="eyebrow">
            Acesso ao sistema
          </p>

          <h1
            style={{
              marginBottom:
                "8px",
            }}
          >
            Entrar
          </h1>

          <p className="muted">
            Informe suas credenciais para continuar.
          </p>
        </div>

        <div
          className="form"
          style={{
            gridTemplateColumns:
              "1fr",
          }}
        >

          <label>

            <span>
              E-mail
            </span>

            <div
              style={{
                position:
                  "relative",
              }}
            >

              <Mail
                size={17}
                style={{
                  position:
                    "absolute",
                  left: "12px",
                  top: "50%",
                  transform:
                    "translateY(-50%)",
                  opacity: 0.6,
                }}
              />

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target
                      .value
                  )
                }
                placeholder="seu@email.com"
                autoFocus
                style={{
                  paddingLeft:
                    "40px",
                  width: "100%",
                }}
              />

            </div>

          </label>

          <label>

            <span>
              Senha
            </span>

            <div
              style={{
                position:
                  "relative",
              }}
            >

              <LockKeyhole
                size={17}
                style={{
                  position:
                    "absolute",
                  left: "12px",
                  top: "50%",
                  transform:
                    "translateY(-50%)",
                  opacity: 0.6,
                }}
              />

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target
                      .value
                  )
                }
                placeholder="Sua senha"
                style={{
                  paddingLeft:
                    "40px",
                  paddingRight:
                    "42px",
                  width: "100%",
                }}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                style={{
                  position:
                    "absolute",
                  right: "6px",
                  top: "50%",
                  transform:
                    "translateY(-50%)",
                  background:
                    "transparent",
                  border: 0,
                  cursor:
                    "pointer",
                }}
              >

                {showPassword ? (
                  <EyeOff
                    size={17}
                  />
                ) : (
                  <Eye
                    size={17}
                  />
                )}

              </button>

            </div>

          </label>

        </div>

        {error && (

          <div
            className="state error"
            style={{
              textAlign:
                "left",
              marginTop:
                "14px",
            }}
          >
            {error}
          </div>

        )}

        <button
          className="primary"
          disabled={loading}
          style={{
            width: "100%",
            marginTop: "22px",
            justifyContent:
              "center",
          }}
        >
          {loading
            ? "Entrando..."
            : "Entrar"}
        </button>

      </form>

    </div>
  );
}