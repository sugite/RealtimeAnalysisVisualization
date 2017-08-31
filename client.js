$(function () {
    "use strict";

    // 需要的元素
    var uuid = $('#uuid_input');
    var filter_bid = $('#bid_input');
    var view_check = $('#view_check');
    var click_check = $('#click_check');
    var view_check = $('#view_check');
    var table = $('#stat_table');
    var refresh = $('#refresh_btn');
    var clear = $('#clear_btn');

    var stats = [];
    var uuid_val = '';

    window.WebSocket = window.WebSocket || window.MozWebSocket;

    // 浏览器不支持websocket
    if (!window.WebSocket) {
        alert('抱歉，您的浏览器不支持websocket');
        return;
    }

    // 打开连接
    var connection = new WebSocket('ws://10.5.233.29:1991');

    connection.onopen = function () {
        alert('连接成功，请输入uuid，回车结束');
    };

    connection.onerror = function (error) {
        alert('抱歉，连接失败');
    };

    // 收到服务器消息
    connection.onmessage = function (message) {
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log('JSON解析失败: ', message.data);
            return;
        }
        if (uuid_val === '') {
            return ;
        }
        if (uuid_val !== json.uuid) {
            return ;
        }
        json.timestamp = new Date().toLocaleTimeString();
        console.log(stats.push(json));
        addRow(json);
    };

    function dict2String(dict) {
        var ret = '';
        for (var key in dict) {
            if (dict.hasOwnProperty(key)) {
                var element = dict[key];
                ret += '    ' + key + ': ' + element + '<br/>';
            }
        }
        return ret;
    };

    /**
     * 输入uuid
     */
    uuid.keydown(function(e) {
        if (e.keyCode === 13) {
            uuid_val = uuid.val()
            alert('uuid已成功输入')
        }
    });

    /**
     * heartbeat
     */
    setInterval(function() {
        if (connection.readyState !== 1) {
            alert('与服务器断开连接');
        }
    }, 3000);

    /**
     * refresh
     */
    refresh.click(function(){
        clearTable();
        for (var index in stats) {
            addRow(stats[index]);
        }
    });

    /**
     * clear
     */
    clear.click(function(){
        stats = [];
        clearTable();
    });

    /**
     * 过滤埋点
     */
    function filter(json) {
        if (filter_bid.val() !== '' && filter_bid.val() !== json.val_bid) {
            return false
        }
        if (view_check.prop('checked') === false && json.val_type === '看见') {
            return false
        }
        if (click_check.prop('checked') === false && json.val_type === '点击') {
            return false
        }
        return true;
    }

    /**
     * 添加数据到表格中
     */
    function addRow(json) {
        if (filter(json) === false) {
            return;
        }
        var row = document.getElementById("stat_table").insertRow(1);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        var cell4 = row.insertCell(3);
        var cell5 = row.insertCell(4);
        cell1.innerHTML = '<td width="100">' + json.timestamp + '</td>';
        cell2.innerHTML = '<td width="300">' + json.val_desc + '</td>'; 
        cell3.innerHTML = '<td width="100">' + json.val_type + '</td>';
        cell4.innerHTML = '<td width="150">' + json.val_bid + '</td>'; 
        cell5.innerHTML = '<td width="350">' + dict2String(json.val_lab) + '</td>'; 
    }

    /**
     * 清空表格
     */
    function clearTable() {
        var stat_table = document.getElementById("stat_table");
        var rowCount = stat_table.getElementsByTagName('tr').length;
        for (var x = rowCount - 1; x > 0; x--) {
            stat_table.deleteRow(x);
        }
    }
});