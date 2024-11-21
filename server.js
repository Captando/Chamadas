const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Parser } = require('json2csv');

// Configuração do ambiente
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Erro: SUPABASE_URL ou SUPABASE_KEY não configurado no .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Configurar pasta pública para downloads
const downloadDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir);
}

// Configurar pasta pública para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Servir a página index.html na rota principal "/"
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Servir a página admin.html na rota "/admin"
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/downloads', express.static(downloadDir));

// Função utilitária para salvar arquivos CSV
async function saveCSV(data, fields, filename) {
    const json2csv = new Parser({ fields });
    const csv = json2csv.parse(data);

    const filePath = path.join(downloadDir, filename);
    fs.writeFileSync(filePath, csv);

    return `/downloads/${filename}`;
}

// Endpoint para registrar presença
app.post('/api/registrar-presenca', async (req, res) => {
    const { student_name, student_email, student_phone, class_id } = req.body;

    if (!student_name || !student_email || !student_phone || !class_id) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    try {
        const { data: existingAttendance, error: fetchError } = await supabase
            .from('attendances')
            .select('*')
            .eq('student_email', student_email)
            .eq('class_id', class_id);

        if (fetchError) throw fetchError;

        if (existingAttendance.length > 0) {
            return res.status(409).json({ error: 'Presença já registrada para esta aula.' });
        }

        const { error: insertError } = await supabase.from('attendances').insert([
            {
                student_name,
                student_email,
                student_phone,
                class_id,
                registered_at: new Date().toISOString(),
            },
        ]);

        if (insertError) throw insertError;

        res.status(201).json({ message: 'Presença registrada com sucesso.' });
    } catch (error) {
        console.error('Erro ao registrar presença:', error);
        res.status(500).json({ error: 'Erro interno ao registrar presença.' });
    }
});

// Endpoint para listar presenças
app.get('/api/presencas', async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório.' });
    }

    try {
        const { data: presencas, error } = await supabase
            .from('attendances')
            .select('class_id, student_name, registered_at')
            .eq('student_email', email);

        if (error) throw error;

        if (!presencas.length) {
            return res.status(404).json({ error: 'Nenhuma presença encontrada.' });
        }

        res.json(presencas);
    } catch (error) {
        console.error('Erro ao listar presenças:', error);
        res.status(500).json({ error: 'Erro interno ao listar presenças.' });
    }
});

// Endpoint para listar aulas do dia
app.get('/api/aulas/hoje', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const { data: aulaHoje, error } = await supabase
            .from('classes')
            .select('id, title, date, time')
            .eq('date', today)
            .order('time', { ascending: true });

        if (error) throw error;

        if (!aulaHoje.length) {
            return res.status(404).json({ error: 'Nenhuma aula programada para hoje.' });
        }

        res.json(aulaHoje);
    } catch (error) {
        console.error('Erro ao buscar aula do dia:', error);
        res.status(500).json({ error: 'Erro interno ao buscar aula do dia.' });
    }
});

// Endpoint para listar todas as aulas
app.get('/api/aulas', async (req, res) => {
    try {
        const { data: aulas, error } = await supabase
            .from('classes')
            .select('id, title, date, time')
            .order('date', { ascending: true });

        if (error) throw error;

        res.json(aulas);
    } catch (error) {
        console.error('Erro ao listar aulas:', error);
        res.status(500).json({ error: 'Erro interno ao listar aulas.' });
    }
});

// Endpoint para cadastrar aula
app.post('/api/aulas', async (req, res) => {
    const { id, title, date, time } = req.body;

    if (!id || !title || !date || !time) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    try {
        const { data: existingClass, error: fetchError } = await supabase
            .from('classes')
            .select('id')
            .eq('id', id);

        if (fetchError) throw fetchError;

        if (existingClass.length > 0) {
            return res.status(409).json({ error: 'O número da aula já está em uso.' });
        }

        const { error: insertError } = await supabase.from('classes').insert([
            {
                id,
                title,
                date,
                time,
                created_at: new Date().toISOString(),
            },
        ]);

        if (insertError) throw insertError;

        res.status(201).json({ message: 'Aula cadastrada com sucesso.' });
    } catch (error) {
        console.error('Erro ao cadastrar aula:', error);
        res.status(500).json({ error: 'Erro interno ao cadastrar aula.' });
    }
});

// Endpoint para deletar aula
app.delete('/api/aulas/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const { error } = await supabase.from('classes').delete().eq('id', id);

        if (error) throw error;

        res.status(200).json({ message: `Aula com ID ${id} deletada com sucesso.` });
    } catch (error) {
        console.error('Erro ao deletar aula:', error);
        res.status(500).json({ error: 'Erro interno ao deletar aula.' });
    }
});

// Endpoint para gerar CSV de uma aula específica
app.get('/api/alunos/csv/:id', async (req, res) => {
    const { id } = req.params;

    if (!id || isNaN(id)) {
        return res.status(400).json({ error: 'ID da aula é obrigatório e deve ser um número válido.' });
    }

    try {
        const { data: alunos, error } = await supabase
            .from('attendances')
            .select('student_name, student_phone')
            .eq('class_id', parseInt(id, 10));

        if (error) throw error;

        if (!alunos.length) {
            return res.status(404).json({ error: `Nenhum aluno encontrado para a aula com ID ${id}.` });
        }

        const formattedData = alunos.map((aluno) => ({
            student_name: aluno.student_name.split(' ')[0],
            student_phone: aluno.student_phone.slice(-4),
        }));

        const link = await saveCSV(formattedData, ['student_name', 'student_phone'], `alunos_aula_${id}.csv`);
        res.json({ message: 'Arquivo gerado com sucesso.', link });
    } catch (error) {
        console.error('Erro ao gerar CSV para aula específica:', error);
        res.status(500).json({ error: 'Erro interno ao gerar CSV.' });
    }
});

// Endpoint para gerar CSV por intervalo de aulas
app.get('/api/alunos/csv/intervalo', async (req, res) => {
    const { start, end } = req.query;

    if (!start || !end) {
        return res.status(400).json({ error: 'Parâmetros "start" e "end" são obrigatórios.' });
    }

    try {
        const { data: alunos, error } = await supabase
            .from('attendances')
            .select('student_name, student_phone, class_id')
            .gte('class_id', parseInt(start, 10))
            .lte('class_id', parseInt(end, 10));

        if (error) throw error;

        if (!alunos.length) {
            return res.status(404).json({ error: `Nenhum aluno encontrado para as aulas no intervalo ${start} a ${end}.` });
        }

        const formattedData = alunos.map((aluno) => ({
            student_name: aluno.student_name.split(' ')[0],
            student_phone: aluno.student_phone.slice(-4),
            class_id: aluno.class_id,
        }));

        const link = await saveCSV(
            formattedData,
            ['student_name', 'student_phone', 'class_id'],
            `alunos_intervalo_${start}-${end}.csv`
        );

        res.json({ message: 'Arquivo gerado com sucesso.', link });
    } catch (error) {
        console.error('Erro ao gerar CSV para intervalo:', error);
        res.status(500).json({ error: 'Erro interno ao gerar CSV.' });
    }
});

// Endpoint para gerar CSV com todos os alunos registrados
app.get('/api/alunos/csv', async (req, res) => {
    try {
        const { data: alunos, error } = await supabase
            .from('attendances')
            .select('student_name, student_phone');

        if (error) throw error;

        if (!alunos || alunos.length === 0) {
            return res.status(404).json({ error: 'Nenhum aluno registrado encontrado.' });
        }

        // Formatar os dados: apenas primeiro nome e últimos 4 dígitos do telefone
        const formattedData = alunos.map((aluno) => ({
            student_name: aluno.student_name.split(' ')[0], // Primeiro nome
            student_phone: aluno.student_phone.slice(-4),  // Últimos 4 dígitos
        }));

        // Salvar CSV no servidor
        const link = await saveCSV(
            formattedData,
            ['student_name', 'student_phone'],
            `alunos_geral.csv`
        );

        res.status(200).json({ message: 'Arquivo gerado com sucesso.', link });
    } catch (error) {
        console.error('Erro ao gerar CSV com todos os alunos:', error);
        res.status(500).json({ error: 'Erro interno ao gerar CSV.' });
    }
});


// Endpoint para listar alunos mais assíduos
app.get('/api/alunos-assiduos', async (req, res) => {
    const { all } = req.query;

    try {
        const { data: alunos, error } = await supabase.rpc('get_most_active_students', {
            include_all: all === 'true',
        });

        if (error) throw error;

        if (!alunos.length) {
            return res.status(404).json({ error: 'Nenhum aluno encontrado.' });
        }

        res.json(alunos);
    } catch (error) {
        console.error('Erro ao buscar alunos mais assíduos:', error);
        res.status(500).json({ error: 'Erro interno ao buscar alunos mais assíduos.' });
    }
});

// Inicializar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
