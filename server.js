//mount io on express server
let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);
//global vars
let highScore = 0;
let currentScore = 0;
let wasClicked = false;

//send client.html
app.get('/', (req, res) =>{
    res.sendFile(__dirname + '/client.html');
});

//handle a new client connection
io.on('connection', (socketInstance) =>{
    updateCount();
    
    socketInstance.on('clicked', () => {
        wasClicked = true;
        currentScore++;
        if(currentScore > highScore) highScore++;
        io.emit('score',{score:currentScore, highScore:highScore}); 
        io.emit('hello','Stay Alert!');
    });

    //handles disconect events
    socketInstance.on('disconnect', () =>{
        updateCount();
    });
});


//updates the count of active users
const updateCount = () =>{
    io.emit('userCount',{count:io.engine.clientsCount});
    //console.log(io.engine.clientsCount + ' user(s)'); 
}

//send a single msg to a random client with the time
const helloClient = () =>{
    const date = new Date();
    getRandomClient((id)=>{
        io.to(`${id}`).emit('hello', `hello socket ${id} the time is ${date.toUTCString()}`);
    });
    setTimeout(helloClient,5000);
}

// get all connected clients and callback
const findClients = (list) =>{
    io.clients((error, clients) => {
        if (error) throw error;
        //console.log(clients); // => [6em3d4TJP8Et9EMNAAAA, G5p55dHhGgUnLUctAAAB]
        list(clients);
    });
}

//get a random client id
const getRandomClient = (id) =>{
    findClients((list) =>{
        id(list[Math.floor(Math.random() * list.length)]);
    });
}

//helloClient();
const clickBaitGame = () =>{
    //reset wasClicked
    wasClicked = false;
    //send a clickMe event to a random client
    getRandomClient((id)=>{
        io.to(`${id}`).emit('clickMe');
    });
    //give them 3 seconds to click the button
    setTimeout(()=>{
        if(!wasClicked){
            currentScore = 0;
            io.emit('hello','New Game!');
        }
        io.emit('score',{score:currentScore, highScore:highScore});
        clickBaitGame();
    }, 3000);
}
clickBaitGame();
http.listen(process.env.PORT || 3000, () =>{
  console.log('Server listening on port 3000');
});
