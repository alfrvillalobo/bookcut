# ✂️ BookCut — Sistema de Agendamiento

Aplicación fullstack de agendamiento para barberías con calendario interactivo, agenda pública y panel de administración.
 
🌐 **Demo en vivo:** [bookcut-g8bo.vercel.app](https://bookcut-g8bo.vercel.app)
 
---
 
## 🛠️ Stack
 
| Capa | Tecnologías |
|---|---|
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS, FullCalendar |
| **Backend** | FastAPI, Python, SQLAlchemy, PostgreSQL |
| **Deploy** | Vercel (frontend) + Railway (backend + BD) |
 
---
 
## ✨ Características
 
- 📅 Calendario interactivo de citas (semana/mes/día)
- 🌐 Agenda pública — clientes consultan disponibilidad sin login
- 💬 Integración con WhatsApp para confirmar reservas
- 👤 Gestión de clientes con búsqueda en tiempo real
- ✂️ Múltiples servicios por cita con suma automática de precios
- 💰 Dashboard con ingresos semanales y mensuales
- 📱 Diseño responsivo con menú hamburguesa
 
---
 
## 🚀 Instalación local
 
### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload
```
 
### Frontend
```bash
cd frontend
npm install
npm run dev
```

> ⚙️ Recuerda configurar `.env` en backend y `.env.local` en frontend antes de arrancar.
 
---
 
## 👨‍💻 Autor
 
**Alfredo Villalobos** — [GitHub](https://github.com/alfrvillalobo) · ignacioalfredo3105@gmail.com
