
export default class Logger {

    static log(msg,err) {
        console.log(msg)
        if(err) console.log(err, err.stack)
    }
}