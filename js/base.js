;(function() {
  'use strict';

  var $taskDelete,
    $taskDetailSwitch,
    $taskDetail = $('.task-detail'),
    $taskDetailMask = $('.task-detail-mask'),
    taskList = [],
    currentIndex,
    $updataForm,
    $taskDetailCont,
    $taskDetailContInput,
    $checkboxComplete,
    $msg = $('.msg'),
    $msgContent = $msg.find('.msg-content'),
    $msgConfirm = $msg.find('.comfirmed');

  init();

  function init() {
    // 是否有缓存
    taskList = store.get('taskList') || [];

    // Event listener
    listenerSub();
    listenerMsgEvent();
    if (taskList.length) {
      renderTask();
      remindCheck();
    }
  }

  // Delete alerter
  function pop(arg) {
    // 参数不能为空, 否则报错
    if (!arg) {
      console.error('pop title is required.');
    }

    var conf = {},
        $box,
        $mask,
        $title,
        $content,
        $confirm,
        $cancel,
        dfd,
        timer,
        confirmed,
        $body = $('body'),
        $window = $(window);

    dfd = $.Deferred();

    if(typeof arg === 'string') {
      conf.title = arg;
    } else {
      conf = $.extend(conf, arg);
    }


    $box = $('<div>' +
       '<div class="pop-title">' + conf.title + '</div>' +
       '<div class="pop-content">' +
         '<div>' +
           '<button class="primary confirm">确定</button>' +
           '<button class="cancel">取消</button>' +
         '</div>' +
       '</div>' +
      '</div>').css({
      position: 'fixed',
      width: 300,
      height: 'auto',
      padding: '15px 10px',
      color: '#444',
      background: '#fff',
      'border-radius': 3,
      'box-shadow': '0 1px 2px rgba(0, 0, 0, .5)',
      'text-align': 'center'
    });

    $title = $box.find('.pop-title').css({
      padding: '5px 10px',
      'font-weight': 900,
      'font-size': 20,
    });

    $content = $box.find('.pop-content'). css({
      padding: '5px 10px'
    });

    $confirm = $content.find('.confirm');
    $cancel = $content.find('.cancel');

    $mask = $('<div></div>').css({
      position: 'fixed',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(0,0,0,.5)'
    });

    timer = setInterval(function() {
      if (confirmed !== undefined) {
        dfd.resolve(confirmed);
        clearInterval(timer);
        dismissPop();
      }
    }, 50);

    $confirm.on('click', onConfirm);
    $cancel.on('click', onCancel);
    $mask.on('click', onCancel);

    function onConfirm() {
      confirmed = true;
    }

    function onCancel() {
      confirmed = false;
    }

    function dismissPop() {
      $mask.remove();
      $box.remove();
    }

    function adjustBox() {
      var windowWidth = $window.width(),
          windowHeight = $window.height(),
          boxWidth = $box.width(),
          boxHeight = $box.height(),
          moveX, moveY;

      moveX = (windowWidth - boxWidth) / 2;
      moveY = (windowHeight - boxHeight) / 2 - 20;

      $box.css({
        left: moveX,
        top: moveY,
      });
    }

    $window.on('resize', function() {
      adjustBox();
    });

    $mask.appendTo($body);
    $box.appendTo($body);
    $window.resize();
    return dfd.promise();
  }

  function listenerMsgEvent() {
    $msgConfirm.on('click', function() {
      hideMsg();
    });
  }

  function remindCheck() {
    var currTimestamp;
    var itl = setInterval(function() {
      for(var i = 0; i < taskList.length; i++) {
        var item = get(i);
        var taskTImestamp;

        if(!item || !item.remindDate || item.informed) continue;

        currTimestamp = (new Date()).getTime();
        taskTImestamp = (new Date(item.remindDate)).getTime();
        if (currTimestamp - taskTImestamp >= 1) {
          updataTask(i, {informed: true});
          showMsg(item.content);
        }
      }
    }, 500);

  }

  function showMsg(msg) {
    if(!msg) return;
    $msgContent.html(msg).show();
     $('.alerter').get(0).play();
    $msg.show();
  }

  function hideMsg() {
    $msg.hide();
  }

  function get(index) {
    return store.get('taskList')[index];
  }

  // Listener form submit
  function listenerSub() {
    var $taskAdd = $('.add-task');

    $taskAdd.on('submit', function(e) {
      e.preventDefault();
      var newTask = {},
          $input;

      // get the value of task
      $input = $(this).find('input[name=content]');
      newTask.content = $input.val();

      if (!newTask.content) return;
      if (taskAdd(newTask)) {
        renderTask();
        // 清空输入框的值
        $input.val(null);
      }
    });
  }

  // Add and delete task
  function taskAdd(newTask) {
    // new task push into the newList also localStorage is updated
    taskList.push(newTask);
    refreshData();

    return true;
  }

  function taskDel(index) {
    // if there is no index or the index in the taskList notexist
    if (index === undefined || !taskList[index]) return;

    delete taskList[index];
    refreshData();
  }

  // 更新数据库并调用渲染模板
  function refreshData() {
    store.set('taskList', taskList);
    renderTask();
  }

  // 渲染 task list 数据
  function renderTask() {
    var $taskList = $('.task-list'),
        $task;
    var completeItems = [],
        item;

    // 先清空原先就模板, 再遍历 taskList 里的task到item中
    $taskList.html('');
    for (var i = 0; i < taskList.length; i++) {
      item = taskList[i];

      // 判断状态是否完成, 是的话就push到新数组, 初次渲染就直接调用
      if(item && item.complete) {
        completeItems[i] = item;
      } else {
        $task = renderItem(item, i);
      }
      $taskList.prepend($task);
    }

    for (var j = 0; j < completeItems.length; j ++) {
      $task = renderItem(completeItems[j], j);
      if (!$task) continue;
      $task.addClass('completed');
      $taskList.append($task);
    }

    // After the rendering is complete, add the listeners
    $taskDelete = $('.action.delete');
    $taskDetailSwitch = $('.action.detail');
    $checkboxComplete = $('.task-list .complete');
    listenerDel();
    listenerDetail();
    listenerComplete();
  }

  // Task list HTML template
  function renderItem(data, index) {
    if (!data || !index) return;
    var listItemTpl = '<div class="task-item" data-index="' + index + '">' +
        '<span><input class="complete" ' + (data.complete ? 'checked' : '') + ' type="checkbox"></span>' +
        '<span class="task-content">' + data.content + '</span>' +
        '<span class="fr">' +
          '<span class="action delete"> 删除</span>' +
          '<span class="action detail"> 详情</span>' +
        '</span>' +
      '</div>';
    return $(listItemTpl);
  }

  // Listening task Delete key
  function listenerDel() {
    $taskDelete.on('click', function() {
      var $this = $(this);
      var $item = $this.parent().parent();
      var index = $item.data('index');

      pop('确认要删除了咩 ?').then(function(r) {
        r ? taskDel(index) : null;
      });
    });
  }

  // Give details of the switch binding event
  function listenerDetail() {
    var index;
    $('.task-item').on('dblclick', function() {
      index = $(this).data('index');
      showDetail(index);
    });

    $taskDetailSwitch.on('click', function() {
      var $this = $(this);
      var $item = $this.parent().parent();

      // get data-index current value
      index = $item.data('index');
      showDetail(index);
    });
  }

  function listenerComplete() {
    $checkboxComplete.on('click', function() {
      var $this = $(this);
      var index = $this.parent().parent().data('index');
      var item = get(index);

      if(item.complete) {
        updataTask(index, {complete: flase});
      } else {
        updataTask(index, {complete: true});
      }
    });
  }

  // Show task detail
  function showDetail(index) {
    // Render detail HTML
    renderDetail(index);
    currentIndex = index;
    $taskDetail.show();
    $taskDetailMask.show();
  }

  $taskDetailMask.on('click', hideDetail);

  // hide detail function
  function hideDetail() {
    $taskDetail.hide();
    $taskDetailMask.hide();
  }

  // Render detail HTML
  function renderDetail(index) {
    if (index === undefined || !taskList[index]) return;

    var item = taskList[index];
    var tpl = '<form>' +
      '<div class="content">' + item.content + '</div>' +
      '<div class="input-item">' +
      '<input type="text" name="content" value="' + (item.content || '') +
      '" style="display: none;">' +
      '</div>' +
      '<div>' +
      '<div class="desc input-item">' +
      '<textarea name="desc">' + (item.desc || '') + '</textarea>' +
      '</div>' +
      '</div>' +
      '<div class="remind input-item">' +
        '<label>提醒时间</label>' +
        '<input class="datetime" name="remindDate" type="text" value="' + (item.remindDate || '') + '">' +
      '</div>' +
      '<div class="input-item"><button type="submit">更新</button></div>' +
      '</form>';

    // rest template
    $taskDetail.html(null);
    $taskDetail.html(tpl);
    $('.datetime').datetimepicker();


    $updataForm = $taskDetail.find('form');
    $taskDetailCont = $updataForm.find('.content');
    $taskDetailContInput = $updataForm.find('[name=content]');

    $taskDetailCont.on('dblclick', function() {
      $taskDetailContInput.show();
      $taskDetailCont.hide();
    });

    $updataForm.on('submit', function(e) {
      e.preventDefault();
      var data = {};
      data.content = $(this).find('[name=content]').val();
      data.desc = $(this).find('[name=desc]').val();
      data.remindDate = $(this).find('[name=remindDate]').val();
      updataTask(index, data);
      hideDetail();
      // console.log('data', data);
    });
  }

  // Updata current task
  function updataTask(index, data) {
    if (!index || !taskList[index]) return;

    taskList[index] = $.extend({}, taskList[index], data);
    refreshData();
  }

})();