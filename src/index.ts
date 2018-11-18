import app from './app'

const port = 3000

app.listen(port, (err: Error) => {
    if (err) {
        console.log('Error: ', err)
    }
    return console.log(`Server is listening on ${port}`)
})