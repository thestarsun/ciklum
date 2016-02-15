"use strict"
var app = require('http').createServer(function (req, res) {
    res.writeHead(200);
    res.end("Hello world");
});
var moment = require("moment");
var _ = require("underscore");
var io = require('socket.io')(app);

app.listen(1919);

var users = [];
var rooms = {'default': {users: [], messages: [], owner: "", name: "General", id: "default"}};
var connections = {};


io.on('connection', function (socket) {
    var me, myCurrentRoom;
    // { username: String }
    socket.on('login', function (data) {
        if (!~users.indexOf(data.username)) {
            connections[data.username] = socket;
            me = data.username;
            myCurrentRoom = 'default';
            users.push(data.username);
            rooms['default'].users.push(data.username);
            socket.emit('setup', {
                rooms: Object.keys(rooms).map((roomName) => {
                    return {
                        name: rooms[roomName].name,
                        isActive: roomName === "default",
                        isOwner: false,
                        id: roomName
                    }
                }),
                users: rooms['default'].users.map((user) => {
                    return {
                        isMe: user === me,
                        name: user
                    };
                }),
                messages: rooms['default'].messages.map((msg)=> {
                    msg.isMy = msg.name === me;
                    return msg;
                })
            });
            for (let user of rooms['default'].users) {
                if (connections[user] && user !== me)
                    connections[user].emit('user joined', {users: {name: data.username, isMe: false}});
            }
        } else {
            socket.emit('appError', {id: 1, message: "Username prohibited"});
        }
    });
    //{ name: String }
    socket.on('new room', function (data) {
        if (!rooms[data.name]) {
            rooms[data.name] = {users: [], messages: [], owner: me, name: data.name, id: data.name};
            for (let user in connections) {
                if (connections.hasOwnProperty(user)) {
                    data.isActive = false;
                    data.isOwner = me === user;
                    data.id = data.name;
                    connections[user].emit('room created', data);
                }
            }
        } else {
            socket.emit('appError', {id: 21, message: "Room with provided name existsd"});
        }
    });
    //edit room ( { id: String, name: String, remove: Boolean } )
    socket.on('edit room', function (data) {
        //{id: $parent.find('span').text(), name: $target.val().trim(), remove: false}
        if (data.remove) {
            if (rooms[data.id]) {
                //TBD change current room for users inside
                rooms["default"].users.concat(rooms[data.id].users);
                delete rooms[data.id];
                for (let user in connections) {
                    connections[user].emit("room removed", {id: data.id});
                    connections[user].emit("room switched", rooms["default"]);
                }
            }
        } else {
            rooms[data.id].name = data.name;
            for (let user in connections) {
                if (connections.hasOwnProperty(user)) {
                    connections[user].emit("room updated", _.extend({}, rooms[data.name], {
                        name: data.name,
                        isOwner: rooms[data.id].owner === me,
                        id: data.id
                    }));
                }
            }
        }
    });
    //{ room: Room }
    socket.on('switch room', function (data) {
        rooms[data.id].users.concat(rooms[myCurrentRoom].users.splice(rooms[myCurrentRoom].users.indexOf(me), 1));
        rooms[data.id].users.push(me);
        for (let user of rooms[myCurrentRoom].users) {
            if (connections[user]) {
                connections[user].emit('user left', {user: me})
            }
        }


        myCurrentRoom = data.id;
        socket.emit('setup', {
            rooms: Object.keys(rooms).map((roomName) => {
                return {
                    name: rooms[roomName].name,
                    isActive: roomName === myCurrentRoom,
                    isOwner: rooms[roomName].owner,
                    id: roomName
                }
            }),
            users: rooms[myCurrentRoom].users.map((user) => {
                return {
                    isMe: user === me,
                    name: user
                };
            }),
            messages: rooms[myCurrentRoom].messages.map((msg)=> {
                msg.isMy = msg.name === me;
                return msg;
            })
        });
        socket.emit("room switched", rooms[data.id]);

        /* @todo Не тригерится событие */
        for (let user of rooms[data.id].users) {
            if (connections[user] && user !== me) {
                connections[user].emit('user joined', {users: {name: me, isMe: false}})
            }
        }
    });
    //new message ( { message: String } )
    socket.on('new message', function (data) {
        let freshMessage = {message: data.message, name: me, date: moment().format('LT')};
        rooms[myCurrentRoom].messages.push(freshMessage);
        for (let user of rooms[myCurrentRoom].users) {
            freshMessage.isMy = me === user;
            connections[user].emit('message created', freshMessage);
        }
    });
    socket.on('disconnect', function () {
        for (let user of rooms[myCurrentRoom].users) {
            connections[user].emit('user left', {user: me});
        }
        delete connections[me];
        users.splice(users.indexOf(me), 1);
        rooms[myCurrentRoom].users.splice(rooms[myCurrentRoom].users.indexOf(me), 1);
    })


});