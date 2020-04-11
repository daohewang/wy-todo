# todo 本地备忘录

&emsp;&emsp;JQuery + store 实现本地存储.

> 原理实现

&emsp;&emsp;主要原理就是通过事件监听器给表单`.add-task`监控`submit`事件, 如果有表单提交, 检测是否有值, 有值就存入store中.`renderItem`渲染dom, `renderTask`负责渲染data模块和插入模板.