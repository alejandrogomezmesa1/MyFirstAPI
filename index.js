import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const FILE_PATH = path.join(__dirname, 'bd.json');

app.use(express.json());

const MostrarInicio = () => {
    return { 
        mensaje: '¡Hola! Bienvenido a la API de Libros',
        descripcion: 'Esta API permite gestionar un catálogo de libros.',
        rutas_disponibles: {
            "GET /libros": "Obtiene la lista completa de libros.",
            "GET /libros/:id": "Obtiene los detalles de un libro específico usando su ID.",
            "POST /libros": "Crea un nuevo libro (requiere 'titulo' y 'autor' en formato JSON).",
            "PUT /libros/:id": "Actualiza la información de un libro existente por su ID.",
            "DELETE /libros/:id": "Elimina un libro del catálogo por su ID."
        }
    };
}

const leerDatos = async () => {
    try {
        const data = await fs.readFile(FILE_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error al leer el archivo:', error.message);
        return [];
    }
};

// Función auxiliar para escribir en el archivo JSON
const guardarDatos = async (datos) => {
    try {
        await fs.writeFile(FILE_PATH, JSON.stringify(datos, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error al escribir en el archivo:', error.message);
    }
};

// 1. Endpoint básico: Obtener todos los libros (GET)
app.get('/libros', async (req, res) => {
    const libros = await leerDatos();
    res.json(libros);
});

app.get('/', async (req, res) => {
    const libros = await MostrarInicio();
    res.json(libros);
});

// 2. Método GET por ID: Obtener un libro específico
app.get('/libros/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const libros = await leerDatos();
    const libro = libros.find(l => l.id === id);

    if (!libro) {
        return res.status(404).json({ error: 'Libro no encontrado' });
    }
    res.json(libro);
});

// 3. Método POST: Crear un nuevo libro
app.post('/libros', async (req, res) => {
    const { titulo, autor } = req.body;
    
    if (!titulo || !autor) {
        return res.status(400).json({ error: 'Faltan datos (titulo, autor)' });
    }

    const libros = await leerDatos();
    const nuevoId = libros.length > 0 ? Math.max(...libros.map(l => l.id)) + 1 : 1;
    
    const nuevoLibro = { id: nuevoId, titulo, autor };
    libros.push(nuevoLibro);
    
    await guardarDatos(libros);
    res.status(201).json(nuevoLibro);
});

// 4. Método PUT: Actualizar un libro por ID
app.put('/libros/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { titulo, autor } = req.body;
    
    const libros = await leerDatos();
    const index = libros.findIndex(l => l.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'Libro no encontrado' });
    }

    // Actualizar campos
    libros[index] = { ...libros[index], titulo: titulo || libros[index].titulo, autor: autor || libros[index].autor };
    
    await guardarDatos(libros);
    res.json(libros[index]);
});

// 5. Método DELETE: Eliminar un libro por ID
app.delete('/libros/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    let libros = await leerDatos();
    
    const index = libros.findIndex(l => l.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'Libro no encontrado' });
    }

    libros = libros.filter(l => l.id !== id);
    await guardarDatos(libros);
    
    res.json({ mensaje: 'Libro eliminado con éxito' });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
