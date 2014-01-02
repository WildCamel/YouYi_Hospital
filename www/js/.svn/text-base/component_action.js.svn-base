/** @brief 组件相关的动作函数放在这里 */

function back()
{
	$.app.back();
}
function openLink(href){
	window.location.href = href;
}

function queue_refresh()
{
	++queue_timer_counter;
	var nodes = $('.sec', $.app.curr_page);
	if (nodes.length > 0) {
		$.each(nodes, function(index, item) {			
			var timeval = $(item).attr("data-val");
			timeval++;
			$(item).attr("data-val",timeval);
			var timestr = timeFormat(timeval);
			$(item).text(timestr);
		});
		if (queue_timer_counter % 10 == 0) {
			$.app.refresh_page();
		}
	}else {
		window.clearInterval(queue_timer);
		queue_timer = undefined;
	}
}

function set_queue_refresh_timer() {
	if (typeof(queue_timer) != 'undefined') {
		window.clearInterval(queue_timer);
	}
	queue_timer_counter = 0;
	queue_timer = self.setInterval('queue_refresh()', 1000);
}

function register1_callback(response) 
{
	var comp = JSON.parse(response);
	if (comp && comp.ui_type == 'cms.CmsMsgPage') {
		$.app.show_msg(comp.info.text);
		if (comp.info.text.indexOf('成功') >= 0) {
			$.app.open_page('self', comp.info.href);
		}
	}
}

function login1_callback(response)
{
	var comp = JSON.parse(response);
	if (comp && comp.ui_type == 'cms.CmsMsgPage') {
		$.app.show_msg(comp.info.text);
		if (comp.info.text.indexOf('成功') >= 0) {
			$.app.open_page('self', comp.info.href, $.app.default_conf['animation'], $.app.STORAGE_EXPIRE_KEEP);
		}
	}
}

function common_form_submit_cbk(response, url)
{
	var comp = JSON.parse(response);
	if (comp) {
		if (comp.ui_type == 'cms.CmsMsgPage') {
			$.app.show_msg(comp.info.text);
			if (comp.info.href  == 'goback') {
				$.app.refresh_page();
			}else {
				$.app.open_page('', comp.info.href, $.app.default_conf['animation'], $.app.STORAGE_EXPIRE_KEEP);
			}
		}else {
			var page = comp_to_html(comp);
			$.app.open_page_with_data('', url, page);
		}
	}
}
function acceptInfo(obj){
	if(obj.title=="pushon"){
		//$.get("http://www.baidu.com",{newsid:"1"},function(data){
			obj.src = nano('{local_path}image/cms/{theme}/radio2.png');
			obj.title = "pushoff";
		//});
	}else if(obj.title=="pushoff"){
		//$.get("http://www.baidu.com",{newsid:"1"},function(data){
			obj.src = nano('{local_path}image/cms/{theme}/radio.png');
			obj.title = "pushon";
		//});
	}
	
}

function picErrLoad(obj){
	obj.src = nano('{local_path}image/cms/{theme}/headerpic.png');	
}

/*
同意协议，挂号页
*obj 改变状态的元素
*/

function Consent(obj){
	var status = obj.title;
	if(status=="TRcheck"){//已经勾选状态
		obj.src = nano('{local_path}image/cms/{theme}/checkbox1.png');
		obj.title = "FScheck";
	}else if(status=="FScheck"){//未勾选状态
		obj.src = nano('{local_path}image/cms/{theme}/checkbox2.png');
		obj.title = "TRcheck";
	}
}
//显示或隐藏协议
function showConsent(){
	var status = $(".showmore").html();
	if(status=="展开"){
		$(".downarr").css("display","none");
		$(".showmore").html("收起");
		$(".scroll_block").css("height","25em;");
	}else if(status=="收起"){
		$(".scroll_block").css("height","10em;");
		$(".downarr").css("display","block");
		$(".showmore").html("展开");
		
	}
	
}


//绘制用户中心的圆圈
function canvasCircle(){	
	//var canvas = document.getElementById("circle1");
	var canvasobj = $('.item');	
	if (canvasobj[0].getContext){
		for(var i=0;i<canvasobj.length;i++){
			var canvas = canvasobj[i];
			var ctx = canvas.getContext('2d');
			ctx.beginPath();
			ctx.arc(150,150,130,0,Math.PI*2,true);	
			ctx.strokeStyle = "#ecf0f6";
			ctx.lineWidth = 20; 
			ctx.lineCap="squre"; 
			ctx.shadowColor = "#ccc";
			ctx.shadowBlur = 2;
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 0;
			ctx.stroke();
			/*ctx.beginPath();
			ctx.arc(70,70,50,0,Math.PI*1.5,true);
			ctx.strokeStyle = "#e66f8e";
			ctx.lineWidth = 10; 	
			ctx.stroke();*/
		}
		
		//绘制比例圆
		var nowmiss = document.getElementById("nowmiss").innerText;
		var allmiss = document.getElementById("allmiss").innerText;
		var degree = nowmiss/allmiss;
		var semicircle = document.getElementById("circle3");
		var semictx =semicircle.getContext('2d');
		semictx.beginPath();
		semictx.arc(150,150,120,0,Math.PI*2*degree,false);
		if(degree<0.5){//按比例设定警告颜色
			semictx.strokeStyle = "#ffbc31";
			semictx.fillStyle = "#ffbc31";
		}else if(degree>0.5){
			semictx.strokeStyle = "#e66f8e";
			semictx.fillStyle = "#e66f8e";
		}
		semictx.lineWidth = 18; 	
		semictx.stroke();
		
		//绘制图片文字
		var textitem = document.getElementById("circle1").innerText;
		var circleText = document.getElementById("circle1").getContext('2d');
		circleText.beginPath();
		circleText.font = "40px Yahei bolder";
		circleText.fillStyle = "#4eb25c";
		circleText.fillText("我的预约",70,150);
		circleText.fillText(textitem,137,210);
		
		
		textitem = document.getElementById("circle2").innerText;
		circleText = document.getElementById("circle2").getContext('2d');
		circleText.beginPath();
		circleText.font = "40px Yahei bolder";
		circleText.fillStyle = "#4eb25c";
		circleText.fillText("我的报告单",50,150);
		circleText.fillText(textitem,137,210);
		
		var textitem1 = document.getElementById("nowmiss").innerText;
		var textitem2 = document.getElementById("allmiss").innerText;
		semictx.beginPath();
		semictx.font = "40px Yahei bolder";
		semictx.fillText("我的爽约",70,150);
		textitem = textitem1+'/'+textitem2;
		semictx.fillText(textitem,123,210);
				
	}else{
		alert("浏览器不支持canvas");
		//浏览器不支持html5 canvas
	}
		
}



//切换nav

function testNav(obj,num){	
	changeTab(obj);
	//变换tab面板的内容
	if(num==1){
		$(".tabbodycont").css("margin-left","0%");
	}else if(num==2){
		$(".tabbodycont").css("margin-left","-100%");
	}
	
}
function changeTab(obj){
	var allnav = $(obj).siblings("div");
	for(var i=0;i<allnav.length;i++){
		$(allnav[i]).removeClass("seltab");
	}
	$(obj).addClass("seltab");
} 



/*挂号时间选择*/
function choseTime(obj){
	$("#regist").attr("href",obj.title);
	$(".radioli").removeClass("radiosel");
	$(obj).addClass("radiosel");
	
}
function moreinfo(){
	var status = $(".showmore").html();
	if(status=="展开"){
		$(".downarr").css("display","none");
		$(".showmore").html("收起");
		$(".departime").css("height","20em;");
	}else if(status=="收起"){
		$(".departime").css("height","6.5em;");
		$(".downarr").css("display","block");
		$(".showmore").html("展开");
		
	}
}

/*
**num int,秒数  
**timtstr  String,格式化的时间串
*/
function timeFormat(num){
	var day = Math.floor(num/(24*60*60));
	var hour = Math.floor((num-day*24*60*60)/(60*60));
	var mis = Math.floor((num-day*24*60*60-hour*60*60)/60);
	var sec = Math.floor(num-day*24*60*60-hour*60*60-mis*60);
	var timestr = "";

	if(day>=1){//如果长于1天，显示天数
		timestr = day + "天前";
	}else{
		if(hour>=1){//如果长于1小时，显示小时
			timestr = hour + "小时" + mis + "分" + sec +"秒前";
		}else{
			if(mis>=1){//如果时间长于1分钟，显示分钟
				timestr = mis + "分" + sec +"秒前";
			}else{
				timestr = sec +"秒前";
			}
		}
	}
	return timestr;
}

//判断挂号是否同意声明
function chkgo(e,target){
	var check_status = $("#trc").attr("title");
	if(check_status=="TRcheck"){
		$.app.action_open_page(e,target);
	}
}


//input框选中后的效果
function inputFocus(obj){
	$(obj).parent().addClass("input_focus");
}
function inputBlur(obj){
	$(obj).parent().removeClass("input_focus");
}




function showshare(title,url,pic){	
	$(".share_area").show();	
}

