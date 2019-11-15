const express = require('express')
const app = express()
const path = require('path')
const bodyParser = require('body-parser')
const { promisify } = require('util')
const sgMail = require('@sendgrid/mail')


const GoogleSpreadsheet = require('google-spreadsheet')
const credentials = require ('./bugtracker.json')
//configuraçoes
const docID = 'docID'
const worksheetIndex = 0
const sendGridKey = 'SendGridKey'


app.set('view engine', 'ejs')
app.set('views', path.resolve(__dirname, 'views'))

app.use(bodyParser.urlencoded({extended: true}))

app.get('/', (request, response) => {
    response.render('home')
})
app.post('/', async(request, response) =>{   
    try{ 
        const doc = new GoogleSpreadsheet(docID)
        await promisify(doc.useServiceAccountAuth)(credentials)
        console.log('Spreadsheet opened')
        const info = await promisify(doc.getInfo)()
        const worksheet = info.worksheets[worksheetIndex]
        await promisify(worksheet.addRow)({
            name: request.body.name, 
            email: request.body.email, 
            issueType: request.body.issueType, 
            howToReproduce: request.body.howToReproduce, 
            expectedOutput: request.body.expectedOutput, 
            receivedOutput: request.body.receivedOutput,
            source: request.query.source || 'direct',
            userAgent: request.body.userAgent, 
            userDate: request.body.userDate
        })

        //if critical
        if(request.body.issueType === 'CRITICAL'){
            sgMail.setApiKey(sendGridKey)
            const msg = {
            to: 'e-mail',
            from: 'e-mail',
            subject: 'Critical Bug Reported',
            text: `The user ${request.body.name} reported a problem`,
            html: `The user ${request.body.name} reported a problem`,
            };
            await sgMail.send(msg)
        }

        response.render('success')
        }catch(err){
            response.end('Erro whilst sending form')
            console.log(err)
        }
})

app.listen(3000, (err) =>{
    if(err){
        console.log('An error occured: ' + err)
    }
    else{
        console.log('BugTracker is running on port http://localhost:3000')
    }
})