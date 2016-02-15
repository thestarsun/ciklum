var socketHost = 'http://127.0.0.1:1919/';

$(function () {
    var userName = '';
    var socket = io.connect(socketHost);
    var newMessageBeep = new Audio("./assets/alert.mp3"); // buffers automatically when created
    socket.on("connect", function () {
        $('#connectionError').hide();
    });
    socket.on("disconnect", function () {
        $('#connectionError').show();
    });
    socket.on('appError', function (data) {
        switch (data.id) {
            case 1:
                $('#username_error').show();
                break;
            case 21:
                $('#roomname_error').show();
                break;
            default:
                break;
        }
    });
    var roomsListTemplate = Handlebars.compile($("#roomsListTemplate").html()),
        usersListTemplate = Handlebars.compile($("#usersListTemplate").html()),
        messagesListTemplate = Handlebars.compile($("#messagesListTemplate").html()),
        messages = [], rooms = [], users = [];

    socket.on('setup', function (data) {
//        {rooms:Object.keys(rooms), users:rooms['default'].users, messages: rooms['default'].messages}
        $('#loginBlock').hide();

        $("#usersList").trigger("refreshUsers", data);
        $("#messagesList").trigger("refreshMessages", data);
        $("#roomsList").trigger("refreshRooms", data);
        messages = data.messages.slice();
        rooms = data.rooms.slice();
        users = data.users.slice();
    });
    socket.on('room created', function (data) {
        rooms.push(data);
        $("#roomsList").trigger("refreshRooms", {
            rooms: rooms
        });
    });
    socket.on('room updated', function (data) {
        $("#roomsList").find("[data-id=" + data.id + "]").find("span").text(data.name);
        $("#roomsList").find("[data-id=" + data.id + "]").find("span").text(data.name);
        var room = rooms.filter(function (room) {
            return String(room.id) === String(data.id);
        }).pop();
        room.name = data.name;
    });
    socket.on('room removed', function (data) {
        $("#roomsList").find("[data-id=" + data.id + "]").remove();
        for (var i = 0; i < rooms.length; i++) {
            if (String(rooms[i].id) === String(data.id)) {
                rooms.splice(i, 1);
                break;
            }
        }
    });
    socket.on('user joined', function (data) {
        users.push(data.users);
        $("#usersList").trigger("refreshUsers", {
            users: users
        });

    });
    socket.on('user left', function (data) {
        for (user in users) {

            if (users[user].name == data.user) {
                delete users[user];
            }
        }
        $("#usersList").trigger("refreshUsers", {
            users: users
        });
    });
    socket.on('room switched', function (data) {
        $("#roomsList").find("[data-id]").removeClass("active-room");
        $("#roomsList").find("[data-id=" + data.id + "]").addClass("active-room");
    });
    socket.on('message created', function (data) {
        messages.push(data);
        $("#messagesList").trigger("refreshMessages", {
            messages: messages
        });
        newMessageBeep.play();
        if (!data.isMy) {
            var notification = window.Notification || window.mozNotification || window.webkitNotification;
            if ('undefined' !== typeof notification) {
                notification.requestPermission(function (permission) {
                    new Notification(data.message);
                });
            }
        }
    });

    $("#messagesList").on("refreshMessages", function (e, data) {
        $("#messagesList").html(messagesListTemplate(data))
        if (data.messages.length) {
            $("#messagesList").animate({
                scrollTop: $("#messagesList .message-block:last-child").offset().top + 100
            }, 500);
        }
    });
    $("#roomsList").on("refreshRooms", function (e, data) {
        $("#roomsList").html(roomsListTemplate(data));
    });
    $("#usersList").on("refreshUsers", function (e, data) {
        $("#usersList").html(usersListTemplate(data));
    });
    $('#loginBtn').click(function () {
        login();
    })
    $('#loginBlock input[name="username"]').keypress(function (e) {
        $('#username_error').hide();
        if (e.keyCode === 13) {
            login();
        }
    })

    $('#SendMessageInput').keypress(function (e) {
        if (e.keyCode === 13) {
            sendMessage();
        }
    });
    $('#SendMessageButton').click(function () {
        sendMessage();
    });
    $('#createRoomInput').keypress(function (e) {
        $('#roomname_error').hide();
        if (e.keyCode === 13) {
            createRoom();
        } else {
            if ([33, 64, 65, 35, 36, 37, 94, 38, 40, 41, 42, 43, 44, 45, 46, 47, 61, 59, 58, 39, 34, 92, 124, 96, 126, 47, 63, 123, 125, 91, 93, 32].indexOf(e.keyCode) > -1) {
                return false;
            }
        }
    });
    $('#createRoomButton').click(function () {
        createRoom();
    });
    $(document).on("click", ".fa-pencil-square-o", function (e) {
        e.stopPropagation();
        var $target = $(e.target),
            $parent = $target.parent();
        if (!$parent.find('input').length) {
            $parent.find('span').hide();
            $parent.prepend($('<input class="editroom" type="text" value ="' + $parent.text().trim() + '"/>'));
        }
    });
    $(document).on("click", ".rooms-list .room[data-id]", function (e) {
        socket.emit("switch room", {
            id: $(e.currentTarget).data("id")
        });
    });
    $(document).on("click", ".editroom", function(e){
        e.stopPropagation();
    });
    $(document).on("keypress", ".editroom", function (e) {
        if (e.keyCode == 13) {
            var $target = $(e.target),
                $parent = $target.parent();
            if ($target.val().trim()) {
                socket.emit('edit room', {id: $parent.data("id"), name: $target.val().trim(), remove: false});
                $parent.find('span').text($target.val().trim());
            }
            $parent.find('input').remove();
            $parent.find('span').show();
        }
    });
    $(document).on("click", ".fa-times", function (e) {
        e.stopPropagation();
        var $target = $(e.target),
            $parent = $target.parent();
        socket.emit('edit room', {id: $parent.data("id"), name: $parent.find('span').text(), remove: true});
    });
    var lHover = 1;
    var rHover = 1;
    $(document).on("click", "#leftBarBtn", function (e) {
        if (rHover < 0) {
            $('#usersBlock').animate({
                'right': "-=70%" //moves left
            });
            $('#chat').css('left', 'auto').animate({
                'right': "-=70%"
            });
            rHover = -rHover;
        } else {
            if (lHover > 0) {
                $('#roomsBlock').animate({
                    'left': "+=70%" //moves left
                });
                $('#chat').animate({
                    'left': "+=70%" //moves left
                });
            } else {
                $('#roomsBlock').animate({
                    'left': "-=70%" //moves left
                });
                $('#chat').animate({
                    'left': "-=70%" //moves left
                });
            }
            lHover = -lHover;
        }
    });
    $(document).on("click", "#rightBarBtn", function (e) {
        if (lHover < 0) {
            $('#roomsBlock').animate({
                'left': "-=70%" //moves left
            });
            $('#chat').animate({
                'left': "-=70%" //moves left
            });
            lHover = -lHover;
        } else {
            if (rHover > 0) {
                $('#chat').css('left', 'auto').animate({
                    'right': "+=70%" //moves left
                });
                $('#usersBlock').animate({
                    'right': "+=70%" //moves left
                });
            } else {
                $('#usersBlock').animate({
                    'right': "-=70%" //moves left
                });
                $('#chat').css('left', 'auto').animate({
                    'right': "-=70%"
                });
            }
            rHover = -rHover;
        }
    });
    $(window).resize(function () {
        lHover = 1;
        rHover = 1;
        if ($(window).width() > 1250) {
            $('#roomsBlock').css('left', 'auto').css('right', 'auto');
            $('#usersBlock').css('left', 'auto').css('right', 'auto');
            $('.chat').css('left', 'auto').css('right', 'auto');
        } else {
            $('#roomsBlock').css('left', '-70%').css('right', 'auto');
            $('#usersBlock').css('right', '-70%').css('left', 'auto');
            $('.chat').css('left', 'auto').css('right', 'auto');
        }
    });

    function sendMessage() {
        if ($('#SendMessageInput').val().trim()) {
            socket.emit('new message', {message: $('#SendMessageInput').val().trim()});
            $('#SendMessageInput').val('');
        }
    }

    function login() {
        if ($('#loginBlock input[name="username"]').val().trim()) {
            socket.emit('login', {username: $('#loginBlock input[name="username"]').val().trim()});
            userName = $('#loginBlock input[name="username"]').val().trim();
            $('#userName').text(userName);
        }
    }

    function createRoom() {
        if ($('#createRoomInput').val().trim()) {
            socket.emit('new room', {name: $('#createRoomInput').val().trim()});
            $('#createRoomInput').val('');
        }
    }

    window.onbeforeunload = function (event) {
        socket.disconnect();
        socket.close();
        return confirm("Confirm refresh");
    };

});
