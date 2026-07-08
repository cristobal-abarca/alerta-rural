import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export default function Login({ onSwitch }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      setError("Email o contraseña incorrectos");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "80px auto", padding: "30px", background: "white", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
      <h2 style={{ color: "#2c5f2d", textAlign: "center", marginBottom: "20px" }}>🔑 Iniciar Sesión</h2>
      {error && <div style={{ background: "#ffebee", color: "#c62828", padding: "10px", borderRadius: "6px", marginBottom: "15px", textAlign: "center" }}>{error}</div>}
      <form onSubmit={handleLogin}>
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          style={{ width: "100%", padding: "12px", marginBottom: "15px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "16px" }} 
          required 
        />
        <input 
          type="password" 
          placeholder="Contraseña" 
          value={pass} 
          onChange={(e) => setPass(e.target.value)} 
          style={{ width: "100%", padding: "12px", marginBottom: "20px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "16px" }} 
          required 
        />
        <button 
          type="submit" 
          style={{ width: "100%", padding: "14px", background: "#2c5f2d", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "600", cursor: "pointer" }}
        >
          Entrar
        </button>
      </form>
      <p style={{ textAlign: "center", marginTop: "20px", color: "#2c5f2d", cursor: "pointer", fontSize: "14px" }} onClick={onSwitch}>
        ¿No tienes cuenta? <strong>Regístrate</strong>
      </p>
    </div>
  );
}