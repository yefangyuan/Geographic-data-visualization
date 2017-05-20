var type = 1;	//默认第一种地图类型

var width = $("#main").width();
var mapRatio = 0.75;	//宽高比
var height = width * mapRatio;
var mapRatioAdjuster = 0.1;
var chinaCenter = [105, 37];	//投影中心，[107,31] 指的是经度和纬度
//定义一个地理投影，用来将经纬度数据转换为二维坐标
var projection = d3.geo.mercator()	//球形墨卡托投影
				.center(chinaCenter)	//设置投影的中心位置
				.translate([width / 2, height / 2])		//设置投影的平移位置
				.scale(640);	//设置投影的缩放系数

//定义一个地理路径生成器，绑定之前定义的地理投影
var path = d3.geo.path().projection(projection);	


var index = 1, 	//显示地图使用的表格的列数，默认第一列
	values = [],	//一列表格数据，格式为：地区名称-数据，形如：values["上海"] = 2415；
	valuesNum = [],	 //一列表格数据，格式为：数据，形如：[211, 1547, ……]
	csvdata = [],	//对象数组，每个对象表示一行表格数据
	bindex = 1;
var parameter = [],		//子配置
	main = [];		//主配置

var flag = 0;

//当地图类型选择列表的值发生改变时，会发生change事件
$("#type-select").change(function(){
	type = $(this).find("option:selected").attr("title");	//获取被选中选项的title
	$("#type"+type).show().siblings().hide();	//显示和隐藏相应的子配置面板
	//获取子配置的内容
	$("#type"+type+" input").each(function(key,value){
     	parameter[key] = $(this).val();
     	//删除子配置中undefined或null的内容
     	for(var i = 0 ;i<parameter.length;i++){
	        if(parameter[i] == "" || typeof(parameter[i]) == "undefined"){
	            parameter.splice(i,1);
	            i= i-1;	              
	        }           
		}
	});
	circle = $(".circle").val();	//当地图类型为3时，存放标记的种类数
	//隐藏多余的颜色拾取器
	$("#type3 .minicolors:gt("+(circle-1)+")").hide();
	$("#type3 .level:gt("+(circle)+")").hide();
	titles = d3.keys(csvdata[0]);
	var sL = $(".color-select option").size();
	console.log(titles)
	if (titles.length!=0 && sL==0) {
		for (var i = 1; i < titles.length; i++) {
			$(".color-select").append("<option value='"+i+"'>"+titles[i]+"</option>");
			$(".bar-select").append("<option value='"+i+"'>"+titles[i]+"</option>");
		}
	}
	chooseMap();	//显示地图
});

//获取主配置的内容
$("#collapse1 input").each(function(key,value){
     main[key] = $(this).val();
});
//当主配置某项发生改变时，会发生change事件
$("#collapse1 input").change(function(){
	$("#collapse1 input").each(function(key,value){
     	main[key] = $(this).val();
	});
	chooseMap();
});

//当子配置某项发生改变时，会发生change事件
$("#collapse2 input").change(function(){
	parameter.length = 0;
	$("#collapse2 input:visible").each(function(key,value){
     	parameter[key] = $(this).val();
	});
	chooseMap();
});

//当地图类型为3时，标记的种类数circle发生改变时，会发生change事件
$(".circle").change(function(){
	circle = $(".circle").val(); 
	$("#type3 .minicolors").show();		//显示所有颜色拾取器
	$("#type3 .minicolors:gt("+(circle-1)+")").hide();	//隐藏不必要的颜色拾取器
	$("#type3 .level").show();		//显示所有分级输入框
	$("#type3 .level:gt("+(circle)+")").hide();		//隐藏不必要的分级输入
	chooseMap();
});
//当地图类型为3时，分级界限发生改变时，设置flag为1，以确定自行设置分级界限
$("#type3 .level input").change(function(){
	flag = 1;
});

//当地图类型为7时
$(".color-select").change(function(){
	index = $(".color-select").val(); 
	bindex = $(".bar-select").val(); 
	chooseMap();
});
$(".bar-select").change(function(){
	index = $(".color-select").val(); 
	bindex = $(".bar-select").val(); 
	chooseMap();
});

//刷新页面
$("#reset").click(function(){
	d3.selectAll('svg').remove();
	type = 1;
	$("#type-select option").eq(0).attr("selected",true);	
	$("#type-select").trigger("change");	//自动触发change事件
});

//上传数据
$('#upload').change(function(evt){
	if (window.File && window.FileReader && window.FileList && window.Blob) {
  		var files = evt.target.files;  //获取加载的文件
  		var file = files[0];
  		getTableData(file);
	} else {
	  	alert("此浏览器不支持 File API，请选择其他浏览器，谢谢！");
	}
});	

function getTableData(file) {
  	var reader = new FileReader();  //定义文件加载器
  	reader.readAsText(file);	//	读取文件内容，读取结果为一串代表文件内容的文本
  	reader.onload = function(event){	//读取文件成功结束后触发load事件
   		csv = event.target.result;
   		csvdata = d3.csv.parse(csv);  //解析CSV文件，返回一个代表解析行的对象数组
   		showTable();
   		$("#type-select").trigger("change");	//自动触发change事件
  	};
  	reader.onerror = function(){ alert("读取文件" + file.fileName + "失败！"); };
}

//显示数据表格
function showTable() {
	var sortAscending = true;	//排序flag
	//添加一个表格
	var table = d3.select('#table')
				.append('table')
				.attr("class","table table-striped table-bordered table-hover table-condensed");
	//表格行
	var rows = table.append('tbody').selectAll('tr').data(csvdata).enter().append('tr');

	titles = d3.keys(csvdata[0]);	//获取表头

	var headers = table.append('thead').append('tr')
				.selectAll('th').data(titles).enter().append('th')
				.text(function(d) {
					return d;
				}).on('click',function(d) {	 //点击表头，实现排序
					if (sortAscending) {	//降序
						rows.sort(function(a, b) {
							return sort(b[d], a[d]);
						});
						sortAscending = false;
						this.className = 'aes';		//显示降序图标
						$(this).siblings().removeClass();
					} else {	//升序
						rows.sort(function(a, b) {
							return sort(a[d], b[d])
						});
						sortAscending = true;
						this.className = 'des';		//显示升序图标
						$(this).siblings().removeClass();
					}
					var innertext = this.innerText;		//获取点击表头内容
					for (var i = 0; i < titles.length; i++) {
						if (titles[i] == innertext) {
							index = i;	//获取点击的列数
							chooseMap();	//根据所选取列数的数据来显示地图
						}
					}
				});

	//添加表格数据
	rows.selectAll('td').data(function(d) {
		return titles.map(function(k) {
			return {
				'value': d[k],
				'name': k
			}
		})
	}).enter().append('td')
	.text(function(d) {
		return d.value;		//这里的d是对象，形如：{name:"2014年",value:"4754"}
	});
	chooseMap();
}


//重写排序算法
function sort(a, b) {
	if (isNaN(a)) {		//如果比较的是中文汉字
		return a.localeCompare(b);	//按拼音排序
	} else {	//如果比较的是数字
		a = Number(a);
		b = Number(b);
		return a > b ? 1 : a == b ? 0 : -1;
	}
}


//读取地图数据，绘制地图
d3.json("/data/china.json",function(t, e) {		//请求一个JSON对象
	if (t) return console.error(t);
	geodata = topojson.feature(e, e.objects.china);		//将TopoJSON转换成GeoJSON
	chooseMap();	
});


function chooseMap() {
	//隐藏多余的颜色拾取器
	titles = d3.keys(csvdata[0]);
	$("#type5 .minicolors:gt("+(titles.length-1)+")").hide();
	$("#type6 .minicolors:gt("+(titles.length-1)+")").hide();
	if (type == 1) {
		showMap();
	}else if (type == 2) {
		showMap();
		drawColor();
	} else if (type == 3) {
		showMap();
		drawCircle();
	}else if(type == 4){
		showMap();
		drawBar(index,parameter);
	}
	else if(type== 5){
		showMap();
		drawPie();
	}else if(type == 6){
		showMap();
		drawContrastBar();
	}else if (type == 7) {
		showMap();
		drawColorBar();
	}else if (type == 7) {
		showMap();
		drawColorCircle();
	}
}
function showMap() {
	getValues(csvdata,index);
	d3.selectAll('svg').remove();	//清除地图
	svg = d3.select("#main")
		.append("svg")
		.attr("width", width)
		.attr("height", height)
		.style("background-color", main[0])
		.call(zoom);

	//g标签为svg常用的标签，g用于把相关元素进行组合的容器元素
	china = svg.append("g");
	provinces = china.selectAll("path")
				.data(geodata.features)
				.enter()
				.append("path")
				.attr("d", path)	//用地理路径生成器将GeoJSON数据转为路径数据字符串
				.attr("fill", main[1])	
				.style("opacity", main[2])
				.attr("stroke", main[4])
				.attr("stroke-width", main[3]);

	china.selectAll("text").data(geodata.features).enter().append("text").attr("transform",function(d, i) {
		//调整部分省份名称的位置
		if (d.properties.id == "20") {	//河北
			return "translate(" + (path.centroid(d)[0] - 20) + "," + (path.centroid(d)[1] + 20) + ")"
		} else if (d.properties.id == "24") {	//天津
			return "translate(" + (path.centroid(d)[0] - 5) + "," + (path.centroid(d)[1] + 10) + ")"
		} else if (d.properties.id == "32") {	//香港
			return "translate(" + (path.centroid(d)[0]) + "," + (path.centroid(d)[1] + 10) + ")"
		} else if (d.properties.id == "33") {	//澳门
			return "translate(" + (path.centroid(d)[0] - 15) + "," + (path.centroid(d)[1] + 20) + ")"
		}
		return "translate(" + (path.centroid(d)[0] - 10) + "," + path.centroid(d)[1] + ")"
	}).text(function(d) {
		return d.properties.name;
	}).attr("font-size", main[5])
	.on("mousemove",function(t) {	//提示框
		d3.select("#tooltip").style("top", d3.event.pageY + 10 + "px")
							.style("left", d3.event.pageX + 20 + "px")
							.select("#data-name-tooltip")
							.text(t.properties.name),
		d3.select("#tooltip").select("#data-value-tooltip").text(function(){
			return values[t.properties.name];
		}),
		d3.select("#data-name").text(titles[0]),
		d3.select("#data-value").text(titles[index]),
		d3.select("#tooltip").classed("hidden", !1)
	}).on("mouseout",function() {
		d3.select("#tooltip").classed("hidden", !0)
	});

	//中国的南海诸岛
	china.append("svg:image")
		.attr("xlink:href", "images/southchinasea.png")
		.attr({
			x: width * 0.78,
			y: height * 0.78,
			"width": 55,
			"height": 75
		});
}

var zoom = d3.behavior.zoom()
				.scaleExtent([1, 10])	//设置最小和最大的缩放比例
				.on("zoom", zoomed);	//当zoom事件发生时，调用zoomed函数

// zoomed函数，用于更改需要缩放的元素的属性
function zoomed() {
	// d3.event.translate是平移的坐标值
	// d3.event.scale是缩放的值
	china.attr("transform", 
		"translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")")
}

//对象转数组
function transform(obj) {
	var arr = [];
	for (var item in obj) {
		arr.push(obj[item])
	}
	return arr;
}

//获取一列表格数据
function getValues(csvdata,index) {		
	valuesNum.length = 0;
	for (var i = 0; i < csvdata.length; i++) {
		var arr = transform(csvdata[i]);
		var name = arr[0];
		var value = arr[index];
		values[name] = Number(value);
		valuesNum.push(Number(value));
	} 
}



function drawColor() {
	getValues(csvdata,index);	//获取表格第index列的数据
	var maxvalue = d3.max(valuesNum);
	var minvalue = d3.min(valuesNum);
	var linear = d3.scale.linear()	//构建一个线性比例尺
					.domain([minvalue, maxvalue])	//设置比例尺的定义域
					.range([0, 1]);		//设置比例尺的输出范围

	var a = parameter[1];	//最浅填充颜色
	var b = parameter[0];	//最深填充颜色
	var computeColor = d3.interpolateRgb(a, b);	//返回一个a和b两种颜色值之间的RGB颜色空间插值器

	provinces.style("fill", function(d,i){
				var t = linear(values[d.properties.name]);
				var color = computeColor(t);
				return color.toString();
			});
	var defs = svg.append("defs");  //SVG的<defs>元素用于预定义一个元素使其能够在SVG图像中重复使用
	//设置脚注
	var linearGradient = defs.append("linearGradient")	//线性渐变<linearGradient>
							.attr("id", "linearColor")
							.attr("x1", "0%")
							.attr("y1", "0%")
							.attr("x2", "100%")
							.attr("y2", "0%");
	var stop1 = linearGradient.append("stop")
							.attr("offset", "0%")
							.style("stop-color", a);
	var stop2 = linearGradient.append("stop")
							.attr("offset", "100%")
							.style("stop-color", b);
	var colorRect = svg.append("rect")
						.attr("x", parameter[2])
						.attr("y", parameter[3])
						.attr("width", parameter[4])
						.attr("height", parameter[5])
						.style("fill", "url(#" + linearGradient.attr("id") + ")");
	var minValueText = svg.append("text")
						.attr("x", parameter[2])
						.attr("y", parameter[3])
						.attr("dy", "-0.3em")
						.text(function() {
							return minvalue;
						});
	var maxValueText = svg.append("text")
						.attr("x", Number(parameter[2])+Number(parameter[4])-10)
						.attr("y", parameter[3]).attr("dy", "-0.3em")
						.text(function() {
							return maxvalue;
						});
}

function drawCircle() {
	getValues(csvdata,index);
	var maxvalue = d3.max(valuesNum);
	var minvalue = d3.min(valuesNum);
	valueArray = getValueArray(maxvalue, minvalue, circle);

	china.selectAll("circle")
		.data(geodata.features)
		.enter()
		.append("circle")
		.attr("transform",function(d) {		
			return "translate(" + (path.centroid(d)[0] + 5) + "," 
									+ path.centroid(d)[1] + 10 + ")"
		}).attr("r",function(d, i) {
			var t = values[d.properties.name];
			if (typeof(t) == "undefined") {
				var radius = 0;
			}else{
				var radius = computeRadius(valueArray, t);
			}
			return radius.toString();
		}).attr("fill",function(d, i) {
			var t = values[d.properties.name];
			var color = computeColor(valueArray, t);
			return color;
		}).style("opacity", parameter[parameter.length-7]);

	drawRectText(circle, valueArray);

	function getValueArray(max, min, circle) {	//等差数列分级，an=a1+(n-1)*d，首项a1，公差d
		var arr = [];
		if (flag) {
			for (var i = 0; i <= circle; i++) {
				arr[i] = parameter[i];
			}
		}else{
			arr[0] = min;	//首项
			interval = Math.floor((maxvalue - minvalue + 1) / circle);	//公差
			for (var i = 1; i < circle; i++) {
				arr[i] = arr[0] + i * interval;
			}
			arr[arr.length] = max;
		}
		$("#type3 .level input").each(function(index) {		//填入分级界限
		    $(this).val(arr[index]);
		});
		if (arr[0] > min) {
			alert("最小值输入大于表格数据最小值，请重新输入！")
		}
		if (arr[arr.length-1] < max) {
			alert("最大值分界输入小于表格数据最大值，请重新输入！")
		}
		return arr;
	}

	function computeColor(valueArray, t) {
		var color = [];
		var rColor;
		for (var i = 0; i < parameter.length; i++) {
			if (parameter[i].charAt(0) == "#") {
				color.push(parameter[i]);
			}
		}
		for (var i = 0; i < valueArray.length; i++) {
			var min = valueArray[i];
			var max = valueArray[i + 1];
			if (t > min && t <= max) {
				rColor = color[i];
				break;
			}
			rColor = color[color.length - 1]
		}
		console.log(color)
		return rColor;
	}
	function computeRadius(valueArray, t) {
		var radius = 5;
		for (var i = 0; i < valueArray.length; i++) {
			var min = valueArray[i];
			if (t > min) {
				radius += 5;
			}
		}
		return radius;
	}

	function drawRectText(circle, valueArray) {
		var pLength = parameter.length;
		var cx = Number(parameter[pLength-6]);
		var cy = Number(parameter[pLength-5]);
		var cWidth = Number(parameter[pLength-4]);
		var cHeight = Number(parameter[pLength-3]);
		var xStep = Number(parameter[pLength-2]);
		var yStep = Number(parameter[pLength-1]);
		for (var i = 0; i < circle; i++) {
			svg.append("rect")
				.attr("x", cx)
				.attr("y", cy)
				.attr("width", cWidth)
				.attr("height",cHeight)
				.style("fill", computeColor(valueArray, valueArray[i+1]));
			svg.append("text")
				.attr("x", cx + cWidth + xStep)
				.attr("y", cy + cHeight)
				.text(function() {
					return valueArray[i] + " ~ " +valueArray[i+1];
				});
			cy = cy + yStep;
		}
	}
}


function drawBar(index,parameter){
	getValues(csvdata,index);
	var maxvalue = d3.max(valuesNum);
	var minvalue = d3.min(valuesNum);
	var maxBarHeight = Number(parameter[1]);
	var barWidth = Number(parameter[0]);
	var linear = d3.scale.linear()	//构建一个线性比例尺
					.domain([minvalue, maxvalue])	//设置比例尺的定义域
					.range([0, 1]);		//设置比例尺的输出范围
	//返回一个0，maxBarHeight两个数字之间的数字插值器
	var computebarHeight = d3.interpolateNumber(0, maxBarHeight);
	china.selectAll("rect").data(geodata.features).enter().append("rect")
		.attr("transform",function(d) {
			var t = values[d.properties.name];

			if(t == "" || typeof(t) == "undefined"){
				adjust = 0;
			}else{
				var x = linear(t);
				adjust = computebarHeight(x);
			}

			return "translate(" + (path.centroid(d)[0]) + "," 
								+ (path.centroid(d)[1]-adjust) + ")"
		}).attr("width", barWidth+"px")
		.attr("fill",parameter[2])
		.attr("height", function(d) {
			var t = values[d.properties.name];
			if(t == "" || typeof(t) == "undefined"){
				return 0;
			}else{
				var x = linear(t);
				var barheight = computebarHeight(x);
	          	return barheight+"px";
			}
        }).style("opacity", parameter[3])
        .on("mousemove",function(t) {	//提示框
			d3.select("#tooltip").style("top", d3.event.pageY + 10 + "px")
								.style("left", d3.event.pageX + 20 + "px")
								.select("#data-name-tooltip")
								.text(t.properties.name),
			d3.select("#tooltip").select("#data-value-tooltip").text(function(){
				return values[t.properties.name];
			}),
			d3.select("#data-name").text(titles[0]),
			d3.select("#data-value").text(titles[index]),
			d3.select("#tooltip").classed("hidden", !1)
		}).on("mouseout",function() {
			d3.select("#tooltip").classed("hidden", !0)
		});;
}

function drawPie(){	
	var points = china.selectAll("g")
		.data(geodata.features).enter().append("g")
		.attr("transform",function(d) { 
			return "translate(" + (path.centroid(d)[0]) + "," 
									+ path.centroid(d)[1] +10 + ")" 
		}).attr("class", function(d,i) { 
			return "toggle"+i; 
		}).attr("visibility", "hidden");
	points.append("circle")		//绘制圆点
		.attr("r",parameter[2])
		.attr("visibility","visible")
		.on("click", function(d,i) {	//点击圆点，显示饼状图
			d3.selectAll(".toggle"+i).attr('visibility','visible');	
		})
		.style("display","inline")
		.style("cursor","pointer")
		.attr("fill",parameter[0])
		.attr("opacity",parameter[1]);

	var pie = d3.layout.pie()	//构造一个新的默认的饼布局
				.sort(null);  
	var pies = points.selectAll(".pies").data(function(d) { 
			var placename = d.properties.name;
			piedata = [];	//获取某个省份饼状图数据
			for (var i = 0; i < csvdata.length; i++) {
				if (csvdata[i][titles[0]] == placename) {
					for(var j = 1; j < titles.length; j++){
						piedata.push(csvdata[i][titles[j]]);
					}
				}
			}
			return pie(piedata); 	//pie()把数据本身进行改变，计算饼图或圆环图中弧的开始和结束角度
		})
		.enter()
		.append('g');

	var arc = d3.svg.arc()	//新建一个弧度生成器
			.innerRadius(0)		//内半径
			.outerRadius(35);  //外半径
	var piepath = pies.append("path").attr('d',arc)		//使用弧度生成器绘制路径
      	.attr("fill",function(d,i){ return parameter[i+3]; })
      	.on("mousemove",function(d,i) {
			d3.select("#tooltip")
		    .style("top", d3.event.pageY + 10 + "px")
			.style("left", d3.event.pageX + 20 + "px")
		    .select("#data-value-tooltip").text(function(){
					var a = (d.endAngle - d.startAngle)/(2*Math.PI);
					return a.toFixed(2)+"%";
			});
		d3.select("#tooltip").select("#data-name-tooltip").text(d.value);
		d3.select("#data-value").text("占比");
		d3.select("#data-name").text(titles[i+1]);
		d3.select("#tooltip").classed("hidden", !1);
	}).on("mouseout",function() {
		d3.select("#tooltip").classed("hidden", !0);
	}).on("click",function(d,i){	//点击隐藏饼状图
		$(this).parent().parent().attr('visibility','hidden');	
	});

    drawPieRectText();		//脚注
    function drawPieRectText() {
    	var pLength = parameter.length;
		var cx = Number(parameter[pLength-6]);
		var cy = Number(parameter[pLength-5]);
		var cWidth = Number(parameter[pLength-4]);
		var cHeight = Number(parameter[pLength-3]);
		var xStep = Number(parameter[pLength-2]);
		var yStep = Number(parameter[pLength-1]);
		for (var i = 1; i < titles.length; i++) {
			svg.append("rect")
				.attr("x", cx)
				.attr("y", cy)
				.attr("width", cWidth)
				.attr("height", cHeight)
				.style("fill", parameter[i+2]);
			svg.append("text")
				.attr("x", cx + cWidth + xStep)
				.attr("y", cy + cHeight)
				.text(function() {
					return titles[i]
				});
			cy = cy + yStep;
		}
	}
}

function drawContrastBar(){
	var tabledata = getTableContent();
	function getTableContent(){	//获取表格所有数据，以便求得最大值和最小值
	    var mytable = $("#table table")[0];
	    var data = [];
	    for(var i=1,rows = mytable.rows.length; i<rows; i++){
	        for(var j=1,cells=mytable.rows[i].cells.length; j<cells; j++){
	            if(!data[i]){
	                data[i] = new Array();
	            }
	            data[i][j] = Number(mytable.rows[i].cells[j].innerHTML);
	        }
	    }
		data = [].concat.apply([],data)
	    return data;
	}

	var maxvalue = d3.max(tabledata);
	var minvalue = d3.min(tabledata);
	var bin_num = titles.length - 1;  //表格数据列数
	var maxBarHeight = Number(parameter[4]);  
	var barWidth = Number(parameter[3]);

	var linear = d3.scale.linear()	//构建一个线性比例尺
					.domain([0, maxvalue])	//设置比例尺的定义域
					.range([0, 1]);		//设置比例尺的输出范围
	//返回一个0，maxBarHeight两个数字之间的数字插值器
	var computebarHeight = d3.interpolateNumber(0, maxBarHeight);	

	var points = china.selectAll("g")
		.data(geodata.features)
		.enter()
		.append("g")
		.attr("transform",function(d) { return "translate(" + (path.centroid(d)[0]) + "," + path.centroid(d)[1] +10 + ")" })
		.attr("class", function(d,i) { return "toggle"+i; })
		.attr("visibility", "hidden");

	points.append("circle")		//绘制圆点
		.attr("r",parameter[2])
		.attr("visibility","visible")
		.on("click", function(d,i) { 
			d3.selectAll(".toggle"+i).attr('visibility','visible');	
		})
		.style("display","inline")
		.style("cursor","pointer")
		.attr("fill",parameter[0])
		.attr("opacity",parameter[1]);

	var bars = points.selectAll(".bars").data(function(d) { 
		var placename = d.properties.name;
		barsdata = []; 
		for (var i = 0; i < csvdata.length; i++) {
			if (csvdata[i][titles[0]] == placename) {
				for(var j = 1; j < titles.length; j++){
					barsdata.push(Number(csvdata[i][titles[j]]));
				}
			}
		}
		return barsdata;	//每个省份对应的表格数据
	})
	.enter()
	.append('rect')
	.attr("x",function(d,i){  
        return (i-Math.floor(titles.length/2)) * barWidth;   
    })  
    .attr("y", function(d,i){  
        return -computebarHeight(linear(d));  
    })  
    .attr("width", function(d,i){  
        return barWidth - 2;   
    })  
    .attr("height", function(d){  
        return computebarHeight(linear(d));  
    })  
    .attr("fill",function(d,i){return parameter[i+5]})
    .on("mousemove",function(d,i) {
		d3.select("#tooltip").style("top", d3.event.pageY + 10 + "px").style("left", d3.event.pageX + 20 + "px")
		  .select("#data-value-tooltip").text(d);
		d3.select("#data-value").text(titles[i+1]);
		d3.select("#tooltip").classed("hidden", !1);
	}).on("mouseout",function() {
		d3.select("#tooltip").classed("hidden", !0)
	}).on("click",function(d,i){	//点击隐藏饼状图
		$(this).parent().attr('visibility','hidden');	
	});


	drawBarRectText();
    function drawBarRectText() {
    	var pLength = parameter.length;
		var cx = Number(parameter[pLength-6]);
		var cy = Number(parameter[pLength-5]);
		var cWidth = Number(parameter[pLength-4]);
		var cHeight = Number(parameter[pLength-3]);
		var xStep = Number(parameter[pLength-2]);
		var yStep = Number(parameter[pLength-1]);
		for (var i = 1; i < titles.length; i++) {
			svg.append("rect")
				.attr("x", cx)
				.attr("y", cy)
				.attr("width", cWidth)
				.attr("height", cHeight)
				.style("fill", parameter[i+4]);
			svg.append("text")
				.attr("x", cx + cWidth + xStep)
				.attr("y", cy + cHeight)
				.text(function() {
					return titles[i]
				});
			cy = cy + yStep;
		}
	}
}
function drawColorBar(){
	drawColor();
	var para = parameter.slice(-4);
	drawBar(bindex,para);
}




//存为图片按钮功能
d3.select('#save').on('click',function() {
	var svgString = getSVGString(svg.node());
	svgString2Image(svgString, 2 * width, 2 * height, 'png', save);
	function save(dataBlob, filesize) {
		saveAs(dataBlob, 'D3 vis exported to PNG.png');
	}
});

function getSVGString(svgNode) {
	svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
	var cssStyleText = getCSSStyles(svgNode);
	appendCSS(cssStyleText, svgNode);
	var serializer = new XMLSerializer();
	var svgString = serializer.serializeToString(svgNode);
	svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink=');
	svgString = svgString.replace(/NS\d+:href/g, 'xlink:href');
	return svgString;
	function getCSSStyles(parentElement) {
		var selectorTextArr = [];
		selectorTextArr.push('#' + parentElement.id);
		for (var c = 0; c < parentElement.classList.length; c++) 
			if (!contains('.' + parentElement.classList[c], selectorTextArr)) 
				selectorTextArr.push('.' + parentElement.classList[c]);
		var nodes = parentElement.getElementsByTagName("*");
		for (var i = 0; i < nodes.length; i++) {
			var id = nodes[i].id;
			if (!contains('#' + id, selectorTextArr)) selectorTextArr.push('#' + id);
			var classes = nodes[i].classList;
			for (var c = 0; c < classes.length; c++) 
				if (!contains('.' + classes[c], selectorTextArr)) 
					selectorTextArr.push('.' + classes[c]);
		}
		var extractedCSSText = "";
		for (var i = 0; i < document.styleSheets.length; i++) {
			var s = document.styleSheets[i];
			try {
				if (!s.cssRules) continue
			} catch(e) {
				if (e.name !== 'SecurityError') throw e;
				continue
			}
			var cssRules = s.cssRules;
			for (var r = 0; r < cssRules.length; r++) {
				if (contains(cssRules[r].selectorText, selectorTextArr)) 
					extractedCSSText += cssRules[r].cssText;
			}
		}
		return extractedCSSText;
		function contains(str, arr) {
			return arr.indexOf(str) === -1 ? false: true
		}
	}
	function appendCSS(cssText, element) {
		var styleElement = document.createElement("style");
		styleElement.setAttribute("type", "text/css");
		styleElement.innerHTML = cssText;
		var refNode = element.hasChildNodes() ? element.children[0] : null;
		element.insertBefore(styleElement, refNode)
	}
}

function svgString2Image(svgString, width, height, format, callback) {
	var format = format ? format: 'png';
	var imgsrc = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
	var canvas = document.createElement("canvas");
	var context = canvas.getContext("2d");
	canvas.width = width;
	canvas.height = height;
	var image = new Image();
	image.onload = function() {
		context.clearRect(0, 0, width, height);
		context.drawImage(image, 0, 0, width, height);
		canvas.toBlob(function(blob) {
			var filesize = Math.round(blob.length / 1024) + ' KB';
			if (callback) callback(blob, filesize)
		})
	};
	image.src = imgsrc;
}

