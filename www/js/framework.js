$.app = {};
$.app = $.extend($.app, new function() {
	/* Public functions begin */

	this.framework_init = function() {
		$(window).on('orientationchange', function() {
			$.app.rerender($.app.curr_page);
		});
		$(window).on('resize', function() {
			$.app.rerender($.app.curr_page);
		});
	}

	this.rerender = function(dom_node) {
		$.each($('[data-aspect-ratio]', dom_node), function(__index, __item) {
			$(__item).css('height', __item.offsetWidth * __item.getAttribute('data-aspect-ratio'));
		});
		$.each(dom_node, function(index, item) {
			item = $(item);
			if (item.hasClass('page')) {
				var screen_height = document.body.clientHeight; //获取屏幕可见区域的高度
				var t = $('.header', item).height();
				if (t > 0) {
					item.css('padding-top', t - 1);
					item.css('min-height', screen_height- t + 1);
				}else{
					item.css('min-height',screen_height);
				}
				t = $('.footer', item).height();
				if (t > 0) {
					item.css('padding-bottom', t - 1);
				}
			}
		});
		
	}

	this.action_open_page = function(e, target)
	{
		var server_url = target.getAttribute('href');
		var rtn = new Object;
		rtn.val = false;
		if (special_link_action_process(target, rtn)) {
			return rtn.val;
		}
		var animation = target.getAttribute('data-transition') || $.app.default_conf['data-transition'];
		var storage_expire = target.getAttribute('data-expire') || $.app.default_conf['data-expire'];
		var check_type = target.getAttribute('data-check-type') || $.app.default_conf['data-check-type'];
		var check_time = target.getAttribute('data-check-time') || $.app.default_conf['data-check-time'];
		var win_name = '';
		if (target.getAttribute('data-rel') == 'self') {
			win_name = 'self';
		}
		$.app.open_page(win_name, server_url, animation, storage_expire, check_type, check_time);
		return false;
	}

	this.action_open_subpage = function(e, target)
	{
		var server_url = target.getAttribute('href');
		var rtn = new Object;
		rtn.val = false;
		if (special_link_action_process(target, rtn)) {
			return rtn.val;
		}
		var animation = target.getAttribute('data-transition') || $.app.default_conf['data-transition'];
		var storage_expire = target.getAttribute('data-expire') || $.app.default_conf['data-expire'];
		var check_type = target.getAttribute('data-check-type') || $.app.default_conf['data-check-type'];
		var check_time = target.getAttribute('data-check-time') || $.app.default_conf['data-check-time'];
		$.app.open_subpage(server_url, animation, storage_expire, check_type, check_time);
		return false;
	}

	/** @brief 打开新页面
	 * @param win_name	窗口名称，可以指定在某个窗口打开。特殊值'self'表示替换当前页面，被替换页面不记入history
	 * @param server_url
	 * @param animation	动画
	 * @param storage_expire	localStorage的超时时间。特殊值-1表示不localStorage；特殊值0表示永久存储；特殊值-2表示维持当前策略，多用于刷新页面；特殊值-3与-2不同的地方在于如果之前没有离线储存，会按默认策略储存
	 * @param check_type	0表示永不检查更新；1表示惰性更新，每次先返回旧值，再检查更新；2表示先尝试更新，再返回值；	
	 * @param check_time		若被localStorage，定期检查是否有更新的时间。0表示每次都检查
	 */
	this.open_page = function(win_name, server_url, animation, storage_expire, check_type, check_time) {
		var rtn = new Object;
		rtn.val = false;
		if (special_href_process(server_url, rtn)) {
			return;
		}
		if (typeof(animation) == 'undefined') {
			animation = $.app.default_conf['data-transition'];
		}
		if (typeof(storage_expire) == 'undefined') {
			storage_expire = $.app.default_conf['data-expire'];
		}
		if (typeof(check_type) == 'undefined') {
			check_type = $.app.default_conf['data-check-type'];
		}
		if (typeof(check_time) == 'undefined') {
			check_time = $.app.default_conf['data-check-time'];
		}
		server_url = $.app.absolute_server_url(server_url);
		$.app.port_open_page(win_name, server_url, animation, storage_expire, check_type, check_time);
	}

	this.open_page_with_data = function(win_name, server_url, page_data, animation) {
		if (typeof(animation) == 'undefined') {
			animation = $.app.default_conf['data-transition'];
		}
		server_url = $.app.absolute_server_url(server_url);
		$.app.port_open_page_with_data(win_name, server_url, page_data, animation);
	}
	
	this.open_subpage = function(server_url, animation, storage_expire, check_type, check_time) {
		if (typeof(animation) == 'undefined') {
			animation = $.app.default_conf['data-transition'];
		}
		if (typeof(storage_expire) == 'undefined') {
			storage_expire = $.app.default_conf['data-expire'];
		}
		if (typeof(check_type) == 'undefined') {
			check_type = $.app.default_conf['data-check-type'];
		}
		if (typeof(check_time) == 'undefined') {
			check_time = $.app.default_conf['data-check-time'];
		}
		$.app.port_open_subpage(server_url, animation, storage_expire, check_type, check_time);
	}

	this.open_new_page = function(url) {
		$.app.port_open_new_page(url);
	}
	
	this.load_page_data = function(server_url, animation, storage_expire, check_type, check_time)
	{
		//检查是否已经在当前DOM中，若在，直接切换出来
		if (pages[$.app.pure_url(server_url)]) {
			do_change_history_state(server_url);
			$.app.protect_switch_to_page(pages[$.app.pure_url(server_url)]);
			return;
		}
		
		var t = $.app.get_tpl(server_url);
		var tpl = t.tpl;
		$.app.tpl_param = t.tpl_param;
		var frame_url = $.app.local_path + 'tpl/' + tpl + '.html';
		$.app.get_data(frame_url, function(data) {
			var new_page = $(nano(data));
			new_page.addClass('hidden');
			new_page.attr('url', server_url);
			if ($.app.get_url_hash(server_url).indexOf('nodata') < 0 ) {	//有nodata参数时不发起数据请求
				$.app.get_json(server_url, function(data, error) {
					if (error) {
						window.open(server_url);
						return;
					}
					console.log('before append: ' + $.app.get_time('ms') + ' ' + server_url);
					do_change_history_state(server_url);
					$.app.building_page = new_page;
					$('body').append(new_page);
					console.log('after append: ' + $.app.get_time('ms') + ' ' + server_url);
					var html = comp_to_html(data);
					console.log('after comp_to_html: ' + $.app.get_time('ms') + ' ' + server_url);
					if (typeof(html.header) != 'undefined') {
						$.app.set_header(html.header, tpl, new_page);
					}
					if (typeof(html.footer) != 'undefined') {
						$.app.set_footer(html.footer, tpl, new_page);
					}
					if (typeof(html.content) != 'undefined') {
						$.app.set_content(html.content, tpl, new_page);
					}
					if (new_page.attr('data-dom-cache') == 'true') {
						pages[$.app.pure_url(server_url)] = new_page;
					}
					console.log('before switch: ' + $.app.get_time('ms') + ' ' + server_url);
					$.app.protect_switch_to_page(new_page, animation);
				}, storage_expire, check_type, check_time);
			}else {
				do_change_history_state(server_url);
				$.app.building_page = new_page;
				$('body').append(new_page);
				$.app.protect_switch_to_page(new_page, animation);
			}
		}, $.app.tpl_expire, $.app.tpl_check_type, $.app.tpl_check_time);
	}
	
	this.display_page_data = function(server_url, page_data, animation)
	{
		var t = $.app.get_tpl(server_url);
		var tpl = t.tpl;
		$.app.tpl_param = t.tpl_param;
		var frame_url = $.app.local_path + 'tpl/' + tpl + '.html';
		$.app.get_data(frame_url, function(data) {
			do_change_history_state(server_url);
			var new_page = $(nano(data));
			new_page.addClass('hidden');
			new_page.attr('url', $.app.pure_url(server_url));
			$.app.building_page = new_page;

			$('body').append(new_page);
			if (typeof(page_data.header) != 'undefined') {
				$.app.set_header(page_data.header, tpl, new_page);
			}
			if (typeof(page_data.footer) != 'undefined') {
				$.app.set_footer(page_data.footer, tpl, new_page);
			}
			if (typeof(page_data.content) != 'undefined') {
				$.app.set_content(page_data.content, tpl, new_page);
			}
			if (new_page.attr('data-dom-cache') == 'true') {
				pages[$.app.pure_url(server_url)] = new_page;
			}
			$.app.protect_switch_to_page(new_page, animation);
		}, $.app.tpl_expire, $.app.tpl_check_type, $.app.tpl_check_time);
	}

	/** @brief 代理监听页面中的交互事件
	 *  @param dom_node Zepto对象，监听范围，比如某个page或某个Dom节点
	 *  @default_action 未指定动作时默认执行的动作，比如普通的a链接。一般指定为$.app.action_open_page
	 */
	this.refresh = function(dom_node, default_action)
	{
		$('[href], [data-click]', dom_node).click(function (e){
			var target = e.target;
			while (target) {
				if (target.getAttribute('data-click') != null) {
					eval(target.getAttribute('data-click'));
					return false;
				}else if (target.getAttribute('href') != null) {
					var href = target.getAttribute('href');
					if (href == '#') {
						return true;
					}
					if (href.indexOf(':') > 0) {
						var p = href.indexOf(':');
						var type = $.trim(href.substr(0, p));
						if (type.length < 12 && !$.app.proxy_protocol[type]) {
							return true;
						}
					}
					if (href.substr(0, 11) == 'javascript:') {
						if (target.tagName == 'A') {
							return true;
						}else {
							eval(href.substr(11));
							return false;
						}
					}
					if (target.getAttribute('data-rel')) {
						switch (target.getAttribute('data-rel')) {
							case 'external':
								//外部链接通过新窗口打开
								if ($.app.client_type == 'webapp' && target.tagName == 'A') {
									target.setAttribute('target', '_blank');
									$.app.toast('外部链接，正在用新窗口打开，请稍后', 3000);
									return true;
								}else {
									$.app.open_new_page(href);
									return false;
								}
								break;
							case 'self': //history replace
								return $.app.action_open_subpage(e, target);
								break;
							case 'back': //回退，优先检查窗口堆栈是否有前向窗口，没有的话继续使用href
								if ($.app.protect_curr_url_index > 0) {
									$.app.back();
									return false;
								}
								break;
							case 'backward': //指向页面堆栈中某个页面的链接，如果堆栈中没有，清空堆栈，AppCan中需要关闭窗口堆栈中的多余窗口
								$.app.go_backward(href);
								return false;
								break;
						}
					}
					return default_action(e, target);
				}
				target = target.parentNode;
			}
		});
		$('form[data-submit]', dom_node).submit(function(e) {
			var target = $(e.target);
			var submit_btn = $('input[type=submit][name][value]', target);
			var data = target.serialize();
			if (target.attr('method').toLowerCase() == 'get') {
				var url = target.attr('action');
				if (url.indexOf('?') > 0) {
					url += '&' + data;
				}else {
					url += '?' + data;
				}
				$.app.get_data($.app.json_data_url(url), function(response) {
					eval(target.attr('data-submit'));
				});
			}else {
				if (submit_btn.length > 0) {
					data += '&' + eval('$.param({' + submit_btn.attr('name') + ':"' + submit_btn.attr('value') + '"})');
				}
				var url = target.attr('action');
				$.app.post_data($.app.json_data_url(url), data, function (response) {
					eval(target.attr('data-submit'));
				});
			}
			return false;
		});
		/*
		var begin = (new Date()).getTime();
		for (var i = 0; i < 10000; ++i) {
			$.each($('*'), function(__index, __item) {
					__item.setAttribute('t', i);
					});
		}*/
		$.each($('[data-loaded]', dom_node), function(__index, __item) {
			var e = new Object;
			e.target = __item;
			eval(__item.getAttribute('data-loaded'));
		});
		$.each($('[data-prelocal=true]', dom_node), function(index, item) {
			if (item.getAttribute('href') != null) {
				$.app.prelocal($.app.json_data_url($.app.absolute_server_url(item.getAttribute('href'))), item);
			}
		});
		$.app.rerender(dom_node);
		//alert((new Date()).getTime() - begin);
	}

	this.set_local_data = function(key, value, data_time, storage_expire, check_type, check_time, is_prelocal) {
		if (typeof(is_prelocal) == 'undefined') {
			is_prelocal = false;
		}
		var t = new Object();
		t.storage_expire = storage_expire;
		t.check_type = check_type;
		t.check_time = check_time;
		if (is_prelocal) {
			t.is_prelocal = is_prelocal;
		}
		t.data_time = $.app.get_time();	//最近一次更新时间
		t.data = value;
		localStorage.setItem(key, JSON.stringify(t));
	}

	this.del_local_data = function(key) {
		localStorage.removeItem(key);
	}
	
	this.get_local_item = function(key) {
		return JSON.parse(localStorage.getItem(key));
	}

	this.del_local_item = function(key) {
		localStorage.removeItem(key);
	}

	//清理过期数据，刷新过期数据
	this.refresh_local_data = function() {
		var t;
		for (var key in localStorage) {
			t = localStorage.getItem(key);
			if (t) {
				if (typeof(t.storage_expire) != 'undefined') {
					if (t.storage_expire != 0 && t.storage_expire + t.data_time < $.app.get_time()) {
						localStorage.removeItem(key);
					}
				}
			}else {
				localStorage.removeItem(key);
			}
		}
	}
	this.get_time = function(type) {
		if (typeof(type) == 'undefined') {
			type = 's';
		}
		var time = (new Date()).getTime();
		switch (type) {
			case 's':
				return parseInt(time/1000);
			case 'ms':
				return time;
		}
	}

	/** @brief 获取数据
	 * @param url
	 * @param calllback	回调函数
	 * @param storage_expire	localStorage的超时时间。特殊值-1表示不localStorage；特殊值0表示永久存储；特殊值-2表示维持当前策略，多用于刷新页面；特殊值-3与-2不同的地方在于如果之前没有离线储存，会按默认策略储存
	 * @param check_type	0表示永不检查更新；1表示惰性更新，每次先返回旧值，再检查更新；2表示先尝试更新，再返回值；	
	 * @param check_time		若被localStorage，定期检查是否有更新的时间。0表示每次都检查
	 */
	this.get_json = function(url, callback, storage_expire, check_type, check_time, not_show_loader)
	{
		url = $.app.json_data_url(url);
		var error = null;
		$.app.get_data(url, function(data) {
			try {
				data = blankRE.test(data) ? null : $.parseJSON(data);
			} catch (e) {
				error = e;
			}
			if (error == null ) {
				callback(data);
			}else {
				$.app.toast('服务器返回数据异常：' + data.substr(0, 40));
			}
		}, storage_expire, check_type, check_time, not_show_loader);
	}


	this.get_data = function(url, callback, storage_expire, check_type, check_time, not_show_loader, is_prelocal)
	{
		/*
		$.get(url, function(data, status, xhr) {
			callback(data, status, xhr);
		});
		*/
		if (typeof(not_show_loader) == 'undefined') {
			not_show_loader = false;
		}
		if (typeof(is_prelocal) == 'undefined') {
			is_prelocal = false;
		}
		var item;
		var has_callback = false;
		if (!not_show_loader && !has_callback) {	//用户没有指定不显示loader
			console.log('before send: ' + $.app.get_time('ms') + ' ' + url);
			$.app.show_loader('ui-data-loading');
		}
		//先检查localstorage中是否有
		if ($.app.offline_cache_on && (item = $.app.get_local_item(url))) {
			//维持当前策略
			if (storage_expire == -2 || storage_expire == -3) {
				storage_expire = item.storage_expire;
				check_type = item.check_type;
				check_time = item.check_time;
			}
			if (check_type == 0 || check_type == 1 || item.is_prelocal /*存在预加载数据，直接使用。不用担心预加载数据过期问题，每次框架启动会自动清理过期数据*/) {
				if (!has_callback) {
					if (callback) {
						try {
							callback(item.data);
						}catch (e) {
							console.log(e.stack);
						}
					}
					has_callback = true;
				}
			}

			//来自pretocal的数据被使用
			if (!is_prelocal && item.is_prelocal) {
				if (storage_expire >= 0) {
					//将prelocal转换为正常的localStorage
					item.is_prelocal = undefined;
					$.app.set_local_data(url, item.data, item.data_time, storage_expire, check_type, check_time);
				}else {
					//不需要缓存的数据，从localStorage删除
					$.app.del_local_item(url);
				}
			}
		}
		if (has_callback) {	//已经使用了本地数据，不要再显示loader
			not_show_loader = true;
		}
		//localStorage中没有，或者需要检查更新
		if (item == null
				|| (item.storage_expire != 0 && (item.storage_expire + item.data_time) < $.app.get_time())
				|| (check_type > 0 && (check_time == 0 || (check_time + item.data_time) < $.app.get_time()))) {
			$.ajax({
				type: 'GET',
				url: url,
				timeout: 20000,
				success: function(data, status, xhr) {
					if ($.app.offline_cache_on) {
						//服务器端强制指定数据的超时类型时，优先使用服务器端的策略
						if (xhr.getResponseHeader('data-expire') != null) {
							storage_expire = parseInt(xhr.getResponseHeader('data-expire'));
						}
						if (xhr.getResponseHeader('data-check-type') != null) {
							check_type = parseInt(xhr.getResponseHeader('data-check-type'));
						}
						if (xhr.getResponseHeader('data-check-time') != null) {
							check_time = parseInt(xhr.getResponseHeader('data-check-time'));
						}
						if (storage_expire >= 0 || is_prelocal) {
							if (storage_expire == -3) { //维持之前策略当发现没有预先储存的内容时，使用默认超时时间
								storage_expire = $.app.default_conf['data-storage-expire'];
							}
							if (xhr.status == 200) { //正常返回的时候才缓存
								$.app.set_local_data(url, data, $.app.get_time(), storage_expire, check_type, check_time, is_prelocal);
							}
						}else {
							//清理已缓存数据
							$.app.del_local_data(url);
						}
					}
					if (!has_callback) {
						if (callback) {
							try {
								console.log('before callback: ' + $.app.get_time('ms') + ' ' + url);
								callback(data);
								console.log('after callback: ' + $.app.get_time('ms') + ' ' + url);
							}catch (e) {
								console.log(e.stack);
							}
						}
						has_callback = true;
					}
				},
				error: function(xhr, type, error) {
					if (!not_show_loader) {
						$.app.toast('请求失败！ErrorType: ' + type + ' Error: ' + error, 3000);
					}
				},
				beforeSend: function(xhr, settings) {
				},
				complete: function(xhr, status) {
					console.log('complete: ' + $.app.get_time('ms') + ' ' + url);
					$.app.hide_loader('ui-data-loading');
					if (!has_callback && item != null) {
						$.app.toast('请求新数据失败，正在使用离线旧数据。', 3000);
						if (callback) {
							try {
								callback(item.data);
							}catch(e) {
								console.log(e.stack);
							}
						}
						has_callback = true;
					}
				}
			});
		}else  {
			if (!has_callback && item != null) { //尝试获取新值失败，使用旧数据
				if (callback) {
					try {
						callback(item.data);
					}catch(e) {
						console.log(e.stack);
					}
				}
				has_callback = true;
			}

			console.log('complete: ' + $.app.get_time('ms') + ' ' + url);
			$.app.hide_loader('ui-data-loading');
		}

	}

	this.post_data = function (url, data, callback, not_show_loader)
	{
		if (typeof(not_show_loader) == 'undefined') {
			not_show_loader = false;
		}
		$.ajax({
			type: 'POST',
			url: url,
			data: data,
			timeout: 20000,
			success: function(data) {
				if (callback) {
					try {
						callback(data);
					}catch(e) {
						console.log(e.stack);
					}
				}
			},
			error: function(xhr, type) {
				$.app.toast('请求失败！', 3000);
			},
			beforeSend: function(xhr, settings) {
				if (!not_show_loader) {
					$.app.show_loader('ui-post-loading');
				}
			},
			complete: function(xhr, status) {
				if (!not_show_loader) {
					$.app.hide_loader('ui-post-loading');
				}
			}
		});
	}

	this.prelocal = function(url, target) {
		var storage_expire, check_type, check_time;
		if (target) {
			storage_expire = target.getAttribute('data-expire') || $.app.default_conf['data-expire'];
			check_type = target.getAttribute['data-check-type'] || $.app.default_conf['data-check-type'];
			check_time = target.getAttribute['data-check-time'] || $.app.default_conf['data-check-time'];
		}else {
			storage_expire = $.app.default_conf['data-expire'];
			check_type = $.app.default_conf['data-check-type'];
			check_time = $.app.default_conf['data-check-time'];
		}
		$.app.get_data(url, null, storage_expire, check_type, check_time, true, true);
	}

	this.load_js = function(url)
	{
		if ($('script[src="' + url + '"]').length == 0) {
			var node = document.createElement('script');
			node.setAttribute('type', 'text/javascript');
			node.setAttribute('src', url);
			document.getElementsByTagName('head')[0].appendChild(node);
		}
	}

	this.load_css = function(url)
	{
		if ($('link[href="' + url + '"]').length == 0) {
			var node = document.createElement('link');
			node.setAttribute('rel', 'stylesheet');
			node.setAttribute('type', 'text/css');
			node.setAttribute('href', url);
			document.getElementsByTagName('head')[0].appendChild(node);
		}
	}

	

	this.link_attr = function(link)
	{
		if (link.href) {
			var t = nano(' href="{href}"', link);
			if (link.prelocal) {
				t += ' data-prelocal="true"';
			}
			if (link.active) {
				t += ' data-active="true"';
			}
			if (link.expire) {
				t += ' data-expire="' + link.expire + '"';
			}
			if (link.check_type) {
				t += ' data-check-type="' + link.check_type + '"';
			}
			if (link.check_time) {
				t += ' data-check-time="' + link.check_time + '"';
			}
			if (link.rel) {
				t += ' data-rel="' + link.rel + '"';
			}
			if (link.prelocal) {
				t += ' data-prelocal="' + link.prelocal + '"';
			}
			return t;
		}else {
			return '';
		}
	}
	this.get_domain = function(url) {
		var p = url.indexOf('://');
		var q;
		if (p > 0 && p < 10) {
			p += 3;
			q = p;
			while (q < url.length && url[q] != '/') {
				++q;
			}
			if (q >= url.length) {
				return url.substr(p)
			}else {
				return url.substr(p, q - p);
			}
		}else {
			return this.get_domain(location.href);
		}
	}
	
	this.get_main_domain = function(url, level) {
		if (typeof(level) == 'undefined') {
			level = 2;
		}
		var domain = this.get_domain(url);
		var p = domain.length - 1;
		while (p >= 0 && level > 0) {
			--p;
			if (domain[p] == '.') {
				--level;
			}
		}
		++p;
		return domain.substr(p);
	}

	this.get_path = function(url)
	{
		var p = url.length - 1;
		while (p > 0 && url[p] != '/') {
			--p;
		}
		if (p > 7) {
			url = url.substr(0, p + 1);
		}else {	//直接域名
			url += '/';
		}
		return url;
	}

	this.absolute_server_url = function(url)
	{
		if (url.indexOf('://') < 0 || url.indexOf('://') > 10) {
			if (url[0] == '/') {
				url = location.origin + url;
			}else if(url[0] == '?') {
				url = 'http://' + location.host + location.pathname + url;
			}else {
				url = $.app.get_path(location.href) + url;
			}
		}
		return url;
	}

	/** @brief URL归一化 */
	this.pure_url = function(url)
	{
		var p = url.indexOf('#');
		if (p >= 0) {
			url = url.substr(0, p) + url.substr(p).replace(/[#&]goback(ward)?/g, '');
		}
		url = url.replace(/[&?]APP_json=1/g, '');
		return url;
	}

	this.get_url_hash = function(url)
	{
		var p = url.indexOf('#');
		if (p >= 0) {
			return url.substr(p);
		}else {
			return '';
		}
	}

	this.get_tpl = function(url)
	{
		var t = new Object();
		t.tpl = 'normal';
		t.tpl_param = '';
		if (url.indexOf('#') >= 0) {
			var hash = url.substr(url.indexOf('#'));
			var match = hash.match('[#?]tpl=([^&]*)');
			if (match) {
				t.tpl = match[1];
				match = hash.match('[#?]tpl_param=([^&]*)');
				if (match) {
					t.tpl_param = match[1];
				}
				if (mem_tpls[t.tpl]) {
					map_url_tpl[$.app.pure_url(url)] = {tpl:t.tpl, tpl_param:t.tpl_param};
				}
				
			}else if (map_url_tpl[$.app.pure_url(url)]) {
				t = map_url_tpl[$.app.pure_url(url)];
			}
		}
		return t;
	}


	/** @brief ajax请求之前自动给url加上json=1参数
	 */
	this.json_data_url = function(url)
	{
		//url = url.replace(/[&?]tpl=[^&]*/i, '');
		//url = url.replace(/[&?]tpl_param=([^&]*)/i, '');a

		if (url.indexOf('#') >= 0) {
			url = url.substr(0, url.indexOf('#'));
		}
		if (url.indexOf('&APP_json=1') < 0 && url.indexOf('?APP_json=1') < 0) {
			if (url.indexOf('?') > 0) {
				url += '&APP_json=1';
			}else {
				url += '?APP_json=1';
			}
		}
		return url;
	}

	this.get_url_param = function(name)
	{
		var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
		var r = window.location.search.substr(1).match(reg);  //匹配目标参数
		if (r!=null) return decodeURIComponent(r[2]); return null; //返回参数值
	}

	this.load_page_state = function()
	{
		map_url_tpl = JSON.parse(localStorage.map_url_tpl);
		$.app.port_load_page_state();
	}

	this.store_page_state = function()
	{
		localStorage.map_url_tpl = JSON.stringify(map_url_tpl);
		$.app.port_store_page_state();
	}

	/* Public functions end */

	/* Private functions begin */
	function special_href_process(url, rtn) {
		if (url == '#goback') {
			$.app.back();
			rtn.val = false;
			return true;
		}else if (url.indexOf('#gobackward') >= 0 && $.app.protect_curr_url_index > 0) {
			$.app.go_backward(url);
			rtn.val = false;
			return true;
		}else if (url.indexOf('#goback') >= 0 && $.app.protect_curr_url_index > 0) {
			$.app.back();
			rtn.val = false;
			return true;
		}
		return false;
	}
	function special_link_action_process(target, rtn) {
		var url = target.getAttribute('href');
		if (target.getAttribute('data-rel') == 'external' || $.app.get_main_domain($.app.absolute_server_url(url)) != $.app.get_main_domain(location.href)) {
			if ($.app.client_type == 'webapp' && target.tagName == 'A') {
				target.setAttribute('target', '_blank');
				$.app.toast('外部链接，正在用新窗口打开，请稍后', 3000);
				rtn.val = true;
				return true;
			}else {
				$.app.open_new_page(url)
				rtn.val = false;
				return true;
			}
		}
		return false;
	}
	
	function do_change_history_state(url, title, history_change_type)
	{
		if (typeof(title) == 'undefined') {
			title = '';
		}
		if ($.app.pure_url(url) != location.href) {
			var state = {title:title, url:$.app.pure_url(url)};
			switch ($.app.protect_history_change_type) {
				case 'replace':
					$.app.protect_url_stack[$.app.protect_curr_url_index].url = $.app.pure_url(url);
					window.history.replaceState(state, title, $.app.pure_url(url));
					break;
				case 'push':
				default:
					if (url.indexOf('#goback') >= 0) { //到这里的肯定是堆栈中没有找到前页的
						$.app.protect_curr_url_index = 0;
						$.app.protect_url_stack[0] = {url:$.app.pure_url(url), y:0};
						$.app.protect_url_stack.length = 1;
					}else {
						if ($.app.protect_url_stack.length > $.app.protect_curr_url_index + 1) {
							//清除堆栈上方的url
							$.app.protect_url_stack.length = $.app.protect_curr_url_index + 1;
						}
						$.app.protect_url_stack[$.app.protect_curr_url_index].y = document.body.scrollTop;
						$.app.protect_curr_url_index = $.app.protect_url_stack.push({url:$.app.pure_url(url), y:0}) - 1;
					}
					window.history.pushState(state, '', $.app.pure_url(url));
			}
			$.app.protect_last_url = location.href;
		}
	}
	/* Private functions end */

	/* Public variables begin */
	this.STORAGE_EXPIRE_NOSTORAGE = -1;
	this.STORAGE_EXPIRE_NOEXPIRE = 0;
	this.STORAGE_EXPIRE_KEEP = -2;
	this.STORAGE_EXPIRE_KEEP_DEFAULT = -3;
	this.CHECK_TYPE_NOCHECK = 0;
	this.CHECK_TYPE_INERT = 1;
	this.CHECK_TYPE_ACTIVE = 2;
	this.default_conf = new Array();
	this.default_conf['data-transition'] = 'slide';
	this.default_conf['data-expire'] = 604800;
	this.default_conf['data-check-type'] = this.CHECK_TYPE_INERT;
	this.default_conf['data-check-time'] = 0;
	this.default_conf['data-dom-cache'] = false;
	this.default_conf['data-prelocal'] = false;
	this.default_conf['animation'] = this.default_conf['data-transition'];
	this.offline_cache_on = true;	//离线缓存机制是否生效
	this.tpl_expire = this.STORAGE_EXPIRE_NOEXPIRE;
	this.tpl_check_type = this.CHECK_TYPE_INERT;
	this.tpl_check_time = 0;

	//设置不自定添加外层div的组件
	this.no_auto_wrap_comp = new Array();
	this.no_auto_wrap_comp['com.text'] = true;
	this.no_auto_wrap_comp['com.btn'] = true;
	this.no_auto_wrap_comp['com.link'] = true;

	this.proxy_protocol = new Array();
	this.proxy_protocol['http'] = true;
	this.proxy_protocol['javascript'] = true;
	/* Public variables end */

	/* Private variables begin */
	var blankRE = /^\s*$/;
	var mem_tpls = new Array(); //需要记忆URL的模板，对于使用过这些模板的url，下一次即使没有携带tpl参数，也会自动识别
	mem_tpls['tabframe'] = true;
	var map_url_tpl = new Array();	//记录url到tpl的映射，只记录mem_tpls中的这些模板对应的url
	var pages = new Array();
	/* Private variables end */

	/* Public global variable begin */
	this.building_page = null; //正在创建中的Page
	this.frame_data_url;
	this.frame_data;	//存储App框架全局共享的数据，比如全局导航
	
	this.local_path;	//保存客户端目录路径
	this.server_url_prefx; //server url前缀
	this.index_url;	//服务器端首页地址
	this.rel_root_path;	//服务器端App相对域名的顶级路径
	this.theme = 'hospital';	//当前页面所使用的theme
	this.client_type = 'webapp';	//客户端类别。webapp|appcan
	this.tpl_param = '';
	
	this.curr_page = null;	//当前显示的Page

	/* Public global variable end */

	/* Protect variable begin */
	this.protect_curr_url_index = 0; //当前窗口在窗口堆栈中的位置
	this.protect_url_stack = new Array();//窗口堆栈
	/* Protect variable end */
});



function comp_to_html(comp) {
	if (typeof(comp) == 'undefined') {
		return '';
	}
	if (typeof(comp) == 'string') {
		return nano(comp);
	}
	//指向App框架的引用
	if (typeof(comp.ref_frame) != 'undefined' && comp.ref_frame) {
		comp = $.app.frame_data[comp.key];
	}
	if (typeof(comp.ui_type) != 'undefined') {
		var inner = eval("ui_" + comp.ui_type + "_to_html(comp)");
		if (typeof(inner) == 'string' && !$.app.no_auto_wrap_comp[comp.ui_type]) {
			var t = '<div class="' + comp.ui_type.replace(/\./, '_') + '"';
			if (comp.id) {
				t += ' id="' + comp.id + '"';
			}
			t += '>' + inner;
			t += '</div>';
			return t;
		}else {
			return inner;
		}
	}
	return '';
}
