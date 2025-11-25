# 🍽 Backend MySQL - Node.js (Buffet UNAB)

Este es el backend del sistema Buffet UNAB.  
Está desarrollado con **Node.js**, **Express**, **MySQL**, y maneja recursos como usuarios, productos, órdenes, categorías y autenticación JWT.

---

## 🚀 Tecnologías principales

- **Node.js**
- **Express**
- **MySQL**
- **jsonwebtoken**
- **multer** (uploads)
- **bcryptjs** (hash)
- **Cloud SQL Proxy** (solo en producción)
- **Middlewares personalizados**

---

## 📂 Estructura del proyecto

```
Backend-MySql-dev/
│
├── controllers/         # Controladores de lógica de negocio
├── routes/              # Endpoints de la API
├── models/              # Modelos MySQL de usuarios, productos, órdenes, etc.
├── middleware/          # Auth, validación, manejo de errores, uploads
├── database/            # Conexión a MySQL y configuración
├── uploads/             # Imágenes subidas
├── utils/               # Funciones auxiliares
│
├── app.js               # Configuración principal de Express
├── server.js            # Levanta el servidor HTTP
├── package.json         # Dependencias del proyecto
└── .gitignore           # Archivos ignorados por Git
```

---

## 🔧 Instalación

Clonar el repositorio:

```bash
git clone https://github.com/tu-usuario/tu-repo.git
cd Backend-MySql-dev
```

Instalar dependencias:

```bash
npm install
```

---

## 🔐 Variables de entorno

Crear un archivo `.env`:

```
PORT=3000
DB_HOST=localhost
DB_USER=
DB_PASSWORD=
DB_NAME=buffet
JWT_SECRET=tu_secreto
```

---

## ▶️ Ejecución

Modo desarrollo:

```bash
npm run dev
```

Modo producción:

```bash
npm start
```

Servidor:

```
http://localhost:3000
```

---

## 🧪 Endpoints principales

### Usuarios
```
POST /api/users/register
POST /api/users/login
GET  /api/users
```

### Productos
```
GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
```

### Categorías
```
GET  /api/categories
POST /api/categories
```

### Órdenes
```
POST /api/orders
GET  /api/orders
```

---

## 🛡 Seguridad

- Middleware JWT  
- Validación de datos  
- Manejo centralizado de errores  
- No subir `.env` ni claves privadas  
- `.gitignore` configurado  

---

## 📄 Licencia

Uso interno — Buffet UNAB.
