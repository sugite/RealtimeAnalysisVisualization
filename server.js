"use strict";

process.title = 'analysis server';

var wsPort = 1991;
var webSocketServer = require('websocket').server;
var http = require('http');
var fs = require('fs');
var qs = require('querystring');

// 用户列表
var clients = [ ];

// 读取文件回调
var readFileCallback = function(response) {
    return function(err, content) {
        if (err) {
            throw err;
        }
        response.write(content);
        response.end();
    }
}

/**
 * HTTP服务器
 */
var server = http.createServer(function(request, response) {    
    if (request.method === 'POST') { // 接收post请求
        console.log((new Date()) + ' HTTP server. POST has recevied.');
        var jsonString = '';
        request.on('data', function(chunk){
            jsonString += chunk;
        }).on('end', function(){
            var jsonObj = qs.parse(jsonString);
            jsonObj.val_lab = JSON.parse(jsonObj.val_lab);
            jsonObj.fingerprint = '';
            console.log(jsonObj);
            jsonString = JSON.stringify(jsonObj);
            for (var i = 0; i < clients.length; i++) {
                clients[i].sendUTF(jsonString);
            }
            response.end();
        });
    } else {
        console.log((new Date()) + ' HTTP server. URL ' + request.url + ' requested.');
        if (request.url === '/index.html') {
            response.writeHead(200, {'Content-Type': 'text/html'});
            fs.readFile('./index.html', readFileCallback(response));
        } else if (request.url === '/client.js') {
            response.writeHead(200, {'Content-Type': 'text/javascript'});
            fs.readFile('./client.js', readFileCallback(response));
        } else if (request.url === '/styles.css') {
            response.writeHead(200, {'Content-Type': 'text/css'});
            fs.readFile('./styles.css', readFileCallback(response));
        } else if (request.url === '/favicon.ico') {
            response.setHeader('Content-Type', 'image/x-icon');
            fs.createReadStream('./favicon.ico').pipe(response);
        } else {
            response.writeHead(404, {'Content-Type': 'text/plain'});
            response.end('File not found!');
        }
    }
});

server.listen(wsPort, function() {
    console.log((new Date()) + " HTTP Server is listening on port " + wsPort);
});

/**
 * WebSocket服务器
 */
var wsServer = new webSocketServer({
    // WebSocket服务器是和HTTP服务器绑定的，ws请求实际上就是一个增强的http请求
    httpServer: server
});

// 每次试图连接ws服务器就会触发回调
wsServer.on('request', function(request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

    // 可以判断origin是否为合法请求，不合法的话可以reject
    var connection = request.accept(null, request.origin); 
    var index = clients.push(connection) - 1;

    console.log((new Date()) + ' Connection accepted.');

    // 用户发送消息
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log(message)
        }
    });

    // 用户断开
    connection.on('close', function(connection) {
        console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected.");
        clients.splice(index, 1);
    });

});
