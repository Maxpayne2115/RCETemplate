// Import necessary modules
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const { Document, Packer, Paragraph, TextRun } = require('docx');

// Create Express app
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Enable CORS (if needed)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// POST endpoint for generating files
app.post('/generate', async (req, res) => {
    try {
        const data = req.body;
        const project_id = data.projectId;
        const project_name = data.projectName;
        const client_name = data.clientName;
        const applications = data.applications;
        const requirements = data.requirements;
        const fileType = data.fileType;

        if (fileType === 'excel') {
            const filePath = await generateExcel(project_id, project_name, client_name, applications, requirements);
            return res.download(filePath, 'project.xlsx');
        } else if (fileType === 'word') {
            const filePath = await generateWord(project_id, project_name, client_name, applications, requirements);
            return res.download(filePath, 'project.docx');
        } else {
            return res.status(400).json({ error: 'Invalid file type' });
        }
    } catch (error) {
        console.error('Error generating file:', error);
        return res.status(500).json({ error: 'Failed to generate file' });
    }
});

// Function to generate Excel file
async function generateExcel(project_id, project_name, client_name, applications, requirements) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Project Details');

    sheet.addRow(['Project ID', project_id]);
    sheet.addRow(['Project Name', project_name]);
    sheet.addRow(['Client Name', client_name]);
    sheet.addRow(['Applications', applications]);
    sheet.addRow(['Requirements', requirements.join(', ')]);

    const filePath = path.join(__dirname, 'temp', 'project.xlsx');
    await workbook.xlsx.writeFile(filePath);

    return filePath;
}

// Function to generate Word file
async function generateWord(project_id, project_name, client_name, applications, requirements) {
    const doc = new Document();

    doc.addSection({
        properties: {},
        children: [
            new Paragraph({ text: 'Project Details', heading: 'Heading1' }),
            new Paragraph(`Project ID: ${project_id}`),
            new Paragraph(`Project Name: ${project_name}`),
            new Paragraph(`Client Name: ${client_name}`),
            new Paragraph(`Applications: ${applications}`),
            new Paragraph({ text: 'Requirements', heading: 'Heading2' }),
            ...requirements.map(req => new Paragraph(req))
        ]
    });

    const filePath = path.join(__dirname, 'temp', 'project.docx');
    await Packer.toBuffer(doc).then(buffer => {
        fs.writeFileSync(filePath, buffer);
    });

    return filePath;
}

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
