const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // To handle JSON payloads
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Storage setup for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Load students and faculties from JSON files
let students = [];
let faculties = [];

fs.readFile('data/students.json', 'utf8', (err, data) => {
    if (!err && data) {
        students = JSON.parse(data);
    }
});

fs.readFile('data/faculties.json', 'utf8', (err, data) => {
    if (!err && data) {
        faculties = JSON.parse(data);
    }
});

// Save function to save data to JSON files
const saveData = (filename, data) => {
    fs.writeFile(filename, JSON.stringify(data, null, 2), (err) => {
        if (err) console.error(`Error writing to ${filename}:`, err);
    });
};
app.use('/Images', express.static(path.join(__dirname, 'Images')));


// Routes for serving static HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin-login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.get('/admin-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

app.get('/enroll-student.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'enroll-student.html'));
});

app.get('/enroll-faculty.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'enroll-faculty.html'));
});

app.get('/enrolled-students.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'enrolled-students.html'));
});

app.get('/enrolled-faculties.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'enrolled-faculties.html'));
});

// Enroll student route
app.post('/enroll-student', upload.single('photo'), (req, res) => {
    const { firstName, lastName, dob, gender, fatherName, motherName, schoolName, tuitionFee, mobileNo, admissionDate, class: currentClass, address, areaPinCode, city, state } = req.body;
    const photo = req.file ? req.file.filename : null;
    const student = { id: Date.now(), firstName, lastName, dob, gender, fatherName, motherName, schoolName, tuitionFee, mobileNo, admissionDate, currentClass, address, areaPinCode, city, state, photo };
    students.push(student);
    saveData('data/students.json', students);
    res.redirect('/admin-dashboard.html');
});

// Enroll faculty route
app.post('/enroll-faculty', upload.single('photo'), (req, res) => {
    const { firstName, lastName, dob, gender, facultyOf, fatherName, motherName, mobileNo, joiningDate, address, areaPinCode, city, state } = req.body;
    const photo = req.file ? req.file.filename : null;
    const faculty = { id: Date.now(), firstName, lastName, dob, gender, facultyOf, fatherName, motherName, mobileNo, joiningDate, address, areaPinCode, city, state, photo };
    faculties.push(faculty);
    saveData('data/faculties.json', faculties);
    res.redirect('/admin-dashboard.html');
});

// API to get enrolled students (for dynamically populating the student selection)
app.get('/api/students', (req, res) => {
    res.json(students);
});

// API to get enrolled faculties
app.get('/api/faculties', (req, res) => {
    res.json(faculties);
});

// Generate fee receipt route
app.post('/generate-fee-receipt', (req, res) => {
    const { studentId, amount, paymentDate } = req.body;
    const parsedStudentId = parseInt(studentId, 10); // Convert studentId to number
    const selectedStudent = students.find(s => s.id === parsedStudentId);

    if (selectedStudent) {
        const receipt = `
            <html>
            <head>
                <title>Fee Receipt</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    header { text-align: center; }
                    .receipt-container { max-width: 600px; margin: 0 auto; }
                    .receipt-header { text-align: center; margin-bottom: 20px; }
                    .student-photo { float: right; margin-left: 20px; width: 100px; }
                    .receipt-details { clear: both; }
                    .receipt-details p { margin: 5px 0; }
                </style>
            </head>
            <body>
                <header>
                    <h1>Impact Knowledge Institute</h1>
                </header>
                <div class="receipt-container">
                    <div class="receipt-header">
                        <h2>Fee Receipt</h2>
                    </div>
                    ${selectedStudent.photo ? `<img src="/uploads/${selectedStudent.photo}" class="student-photo" alt="Student Photo">` : ''}
                    <div class="receipt-details">
                        <p><strong>Student Name:</strong> ${selectedStudent.firstName} ${selectedStudent.lastName}</p>
                        <p><strong>Father's Name:</strong> ${selectedStudent.fatherName}</p>
                        <p><strong>Current Class:</strong> ${selectedStudent.currentClass}</p>
                        <p><strong>Admission Date:</strong> ${selectedStudent.admissionDate}</p>
                        <p><strong>Payment Date:</strong> ${paymentDate}</p>
                        <p><strong>Amount:</strong> ${amount}</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        res.send(receipt);
    } else {
        res.status(404).send('Student not found');
    }
});

// Login route
app.post('/admin-login', (req, res) => {
    const { username, password } = req.body;
    // Implement your authentication logic here
    // For simplicity, let's assume admin/admin as credentials
    if (username === 'SAURAV007' && password === 'Saurav@123') {
        res.redirect('/admin-dashboard.html');
    } else {
        res.status(401).send('Invalid credentials');
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
