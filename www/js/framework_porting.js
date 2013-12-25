
$.app = $.extend($.app, new function() {
	/* Public functions begin */
	/** @brief 初始化框架
	 * @param frame_url	框架数据的地址
	 * @param init_url	框架加载后默认显示的第一个页面，若为空，默认显示首页
	 */
	this.init = function(frame_url, init_url, local_path) {
		toast_node = $('.ui-toast');
		loading_node = $('#loading_block');
		loading_text = $('#loading_text');
		if (local_path) {
			$.app.local_path = local_path;
		}else {
			$.app.local_path = $.app.get_path(window.location.href);
		}
		$.app.frame_data_url = frame_url;
		$.app.framework_init(frame_url, init_url, local_path);
		$.app.get_json($.app.frame_data_url, function(data) {
			$.app.frame_data = data;
			$.app.index_url = $.app.frame_data['index_url'].href;
			$.app.server_url_prefix = $.app.frame_data['server_url_prefix'];
			$.app.rel_root_path = $.app.frame_data['rel_root_path'];
			
			if (!init_url) {
				init_url = get_cookie['init_url'];
				if (init_url) {
					del_cookie['init_url'];
				}else {
					init_url = $.app.index_url;
				}
			}
			//alert($.app.index_url);
			$.app.protect_url_stack[0] = {url:$.app.pure_url($.app.absolute_server_url(init_url)), y:0};
			//载入首页
			$.app.open_page('self', init_url, 'none', $.app.default_conf['data-expire'], $.app.default_conf['data-check-type'], $.app.default_conf['data-check-time']);
		}, 0, 1, 0);
		if (first_page) {	//注册回退监听事件
			window.onpopstate = function (e) {
				if (first_page) {	//屏蔽第一次访问默认执行
					first_page = false;
					$.app.protect_last_url = location.href;
				}else if (location.href != $.app.protect_last_url){
					$.app.protect_last_url = location.href;
					url = location.href;
					$.app.protect_url_stack[$.app.protect_curr_url_index].y = document.body.scrollTop;
					if ($.app.protect_curr_url_index > 0 && $.app.pure_url(url) == $.app.protect_url_stack[$.app.protect_curr_url_index - 1].url) {
						//后退
						direct = -1;
						--$.app.protect_curr_url_index;
					}else {
						//前进
						direct= 1;
						++$.app.protect_curr_url_index;
						if ($.app.protect_curr_url_index < $.app.protect_url_stack.length && $.app.protect_url_stack[$.app.protect_curr_url_index].url == location.href) {
							//do nothing
						}else {
							while ($.app.protect_url_stack.length < $.app.protect_curr_url_index) {
								//正确情况不会走到这里，异常情况下保持url_stack长度有效
								$.app.protect_url_stack.push({url:$.app.pure_url(url), y:0});
							}
							$.app.protect_url_stack[$.app.protect_curr_url_index] = {url:$.app.pure_url(url), y:0};
						}
					}
					is_new_page = false;
					$.app.load_page_data(location.href, $.app.default_conf['animation'], -2, 1, $.app.default_conf['data-check-time']);	//维持之前的LocalStorage状态
				}
			};
		}
		$.app.refresh_local_data();
		
	}

	this.show_loader = function(type, text)
	{
		if (typeof(text) == 'undefined') {
			text = '正在拼命为您加载中...';
		}
		loading_text.text(text);
		loading_node.addClass(type);

	}

	this.hide_loader = function(type)
	{
		loading_node.removeClass(type);
	}


	this.toast = function(text, time)
	{
		if (typeof(time) == 'undefined') {
			time = 3000;
		}
		toast_node.text(text);
		toast_node.show();
		setTimeout(function() { toast_node.hide(); }, time);
	}

	this.port_open_page = function(win_name, server_url, animation, storage_expire, check_type, check_time)
	{
		
		var switch_state;
		if (win_name == 'self') {
			switch_state = prepare_replace_history_state(server_url);
		}else {
			switch_state = prepare_push_history_state(server_url);
		}
		if (switch_state) {
			$.app.load_page_data(server_url, animation, storage_expire, check_type, check_time);
		}
	}
	
	this.port_open_page_with_data = function(win_name, server_url, page_data, animation)
	{
		var switch_state;
		if (win_name == 'self') {
			switch_state = prepare_replace_history_state(server_url);
		}else {
			switch_state = prepare_push_history_state(server_url);
		}
		if (switch_state) {
			$.app.display_page_data(server_url, page_data, animation);
		}
	}


	/** @brief 在WebApp中，单窗口模式，并且考虑到来着搜索点击或浏览器收藏，可能随时直接访问任意一个子页面，因此打开子页面与打开新页面完全一样。打开子页面使用replace_history模式
	 *
	 */
	this.port_open_subpage = function(server_url, animation, storage_expire, check_type, check_time)
	{
		$.app.open_page('self', server_url, animation, storage_expire, check_type, check_time);
	}
	
	/** @brief 新窗口一般会被屏蔽，在这种模式下直接当前窗口跳转 */
	this.port_open_new_page = function(url)
	{
		window.open(url, '_blank', 'location=yes,closebuttoncaption=关闭');
	}

	/** @brief 刷新页面
	 */
	this.refresh_page = function()
	{
		direct = 0;
		$.app.load_page_data($.app.protect_url_stack[$.app.protect_curr_url_index].url, 'none', -2, 2, $.app.default_conf['data-check-time']);
	}

	/** @brief 后退
	 */
	this.back = function()
	{
		history.back();
	}

	/** @brief 指向页面堆栈中某个页面的链接，如果堆栈中没有，清空堆栈，AppCan中需要关闭窗口堆栈中的多余窗口
	 */
	this.go_backward = function(url)
	{
		url = $.app.pure_url($.app.absolute_server_url(url));
		direct = -1;
		var i;
		for (i = $.app.protect_curr_url_index - 1; i >= 0; --i) {
			if ($.app.protect_url_stack[i].url == url) {
				var step = i - $.app.protect_curr_url_index;
				$.app.protect_curr_url_index = i + 1; //设置到指定页面的后一个页面
				history.go(step);
				return;
			}
		}
		$.app.protect_curr_url_index = 0;
		$.app.protect_url_stack[$.app.protect_curr_url_index] = {url:url, y:0};
		$.app.protect_url_stack.length = 1;
		$.app.protect_history_change_type = 'replace';
		is_new_page = true;
		$.app.load_page_data($.app.protect_url_stack[$.app.protect_curr_url_index].url, $.app.default_conf['animation'], -2, 2, $.app.default_conf['data-check-time']);
	}





	this.set_header = function(html, tpl, page)
	{
		var func_name = tpl + '_set_header';
		if (eval('typeof(' + func_name + ')') == 'function') {
			eval(func_name + '(page, html)');
		}
	}

	this.set_content = function(html, tpl, page)
	{
		var func_name = tpl + '_set_content';
		if (eval('typeof(' + func_name + ')') == 'function') {
			eval(func_name + '(page, html)');
		}
	}

	this.set_footer = function(html, tpl, page)
	{
		var func_name = tpl + '_set_footer';
		if (eval('typeof(' + func_name + ')') == 'function') {
			eval(func_name + '(page, html)');
		}
	}

	this.show_msg = function($msg) {
		alert($msg);
	}

	this.port_load_page_state = function() {
		
	}
	this.port_store_page_state = function() {
	}
	
	/*Public functions end */
	
	/*Protect functions begin */
	
	this.protect_switch_to_page = function(new_page, animation)
	{
		var from; //新页面从哪里过来
		var to;	//当前page滑向哪里
		switch (direct) {
			case 1:	//前进
				from = animation + ' in';
				to = animation + ' out';
				break;
			case -1:	//后退
				from = animation + ' in reverse';
				to = animation + ' out reverse';
				break;
			default:	//默认replace
				from = 'hidden';
				to = 'hidden';
				animation = 'none';
		}
		new_page.addClass(from);
		new_page.removeClass('hidden');
		console.log('before refresh: ' + $.app.get_time('ms'));
		$.app.refresh(new_page, $.app.action_open_page);
		console.log('before add animation: ' + $.app.get_time('ms'));
		if (animation != 'none') {
			new_page.addClass('transition');
			//$('body').addClass('ui-mobile-viewport-transitioning viewport-' + animation);
		}
		if ($.app.curr_page) {
			$.app.curr_page.addClass('transition');
		}
		console.log('after add animation: ' + $.app.get_time('ms'));
				/*
				if (new_page) {
					var t = $('.footer', new_page);
					if (t) {
						new_page.css('padding-bottom', t.height() + 2);
						new_page.css('height', document.documentElement.clientHeight - t.height() - 1);
					}
				}*/
		var footer = $('.footer', new_page);
		//footer.css('display', 'none');
		setTimeout(function() {
			console.log('before scroll: ' + $.app.get_time('ms'));
			window.scrollTo(0, 0);
			if ($.app.curr_page) {
				$.app.curr_page.addClass(to);
			}
			console.log('before animation: ' + $.app.get_time('ms'));
			new_page.removeClass(from);
			if (from == 'hidden') {	//此时new_page没有动画，需要立即将footer显示回来
				footer.css('display', 'block');
			}
			var curr_page = $.app.curr_page;
			var first = true;
			var after_transition = function(e) {
				if (first) {
					first = false;
				//	new_page.css('height', '');
					//$('body').removeClass('ui-mobile-viewport-transitioning viewport-' + animation);
					//动画结束后从DOM中删除curr_page
					if (curr_page) {
						console.log('after animation: ' + $.app.get_time('ms'));
						//重新显示footer，应对浏览器fixed的对象在transform以后不显示的bug
						//footer.css('display', 'block');
						if (curr_page.attr('data-dom-cache') == 'true') {
							curr_page.detach();	//保留绑定的事件
						}else {
							curr_page.remove();
						}
						curr_page = null;
						window.scrollTo(0, $.app.protect_url_stack[$.app.protect_curr_url_index].y);
						console.log('after scroll: ' + $.app.get_time('ms'));
					}
				}
			}
			new_page.off('webkitTransitionEnd', after_transition);
			new_page.on('webkitTransitionEnd', after_transition);
			$.app.curr_page = new_page;
		}, 0);
	}
	/*Protect functions end */
	/*Private functions begin */

	/*Utils Begin */
	function prepare_replace_history_state(url){
			$.app.protect_history_change_type = 'replace';
			direct = 1;
			return true;
	}

	function prepare_push_history_state(url){
		if (url == location.href) {
			$.app.protect_history_change_type = 'replace';
			direct = 1;
//			$.app.refresh_page();
			return true;
		}else if ($.app.protect_curr_url_index > 0 && $.app.pure_url(url) == $.app.protect_url_stack[$.app.protect_curr_url_index - 1].url) { 
			//URL与上一个页面一样，执行后退动作
			history.back();
			return false;
		}else if ($.app.protect_curr_url_index + 1 < $.app.protect_url_stack.length && url == $.app.protect_url_stack[$.app.protect_curr_url_index + 1].url) {
			$.app.protect_url_stack[$.app.protect_curr_url_index + 1].y = 0;
			//URL与后一个页面一样，执行前进动作
			history.forward();
			return false;
		}else {
			//正常前进一个页面
			direct = 1;
			is_new_page = true;
			$.app.protect_history_change_type = 'push';
			return true;
		}
	}


	function get_cookie(name)
	{
		var a = document.cookie.split("; ");
		for (var i = 0; i < a.length; ++i) {
			var t = a[i].split("=");
			if (name == t[0]) {
				if (t.length > 1) {
					return unescape(t[1]);
				}else {
					return '';
				}
			}
		}
		return '';
	}

	function del_cookie(name)
	{
		var path = arguments[1] ? arguments[1] : $.app.rel_root_path;
		var date = new Date();
		date.setTime(date.getTime() - 10000);
		document.cookie = name+'=a; expires=' + date.toGMTString() + "; path=" + path;
	}
	/* Utils end */

	/* Private functions end */

	/* Public variables begin */
	/* Public variables end */

	/* Private variables begin */

	var direct = 0; //-1后退；0 replace state；1前进
	var is_new_page = true;
	var first_page = true;

	var loading_node;
	var loading_text;
	var toast_node;

	/* Private variables end */

});

