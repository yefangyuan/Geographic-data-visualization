

var margin = {top: 10,left: 10,bottom: 10,right: 10};
var width = $("#main").width();
	width = width - margin.left - margin.right;
var mapRatio = 0.86;
var height = width * mapRatio;
var mapRatioAdjuster = 0.1;
var chinaCenter = [105, 36];

var projection = d3.geo.mercator().center(chinaCenter).translate([width / 2, height / 2]).scale(width * mapRatio);
var path = d3.geo.path().projection(projection);

//设置三个面板的高度
d3.select("#main").style("height", height + "px");
d3.select("#workspace").style("height", (height - 10) + "px");
d3.select("#table").style("height", (height - 10) + "px");

var indexCol = 1, 	//表格列数
	values = [],	//一列表格数据 地区名称-数据
	valuesNum = [];	//一列表格数据 数据

var request =  GetRequest();
var type = request["type"];
csv = request["data"];
var csvdata = d3.csv.parse(csv);
var titles = d3.keys(csvdata[0]);
var thLenght = titles.length;


//颜色拾取器
$('.colorPick').each(function() {
    $(this).minicolors({
        control: $(this).attr('data-control') || 'hue',
        defaultValue: $(this).attr('data-defaultValue') || '',
        inline: $(this).attr('data-inline') === 'true',
        letterCase: $(this).attr('data-letterCase') || 'lowercase',
        position: $(this).attr('data-position') || 'bottom left',
        theme: 'default'
    });
});


//工具箱初始化及数据监听
var bgColor = $("#type"+type+" .bgColor").val();
$("#type"+type+" .bgColor").change(function(){
	bgColor = $("#type"+type+" .bgColor").val();
	chooseMap();
})
var mapColor = $("#type"+type+" .mapColor").val();
$("#type"+type+" .mapColor").change(function(){
	mapColor = $("#type"+type+" .mapColor").val();
	chooseMap();
})
var opacity = $("#type"+type+" .opacity").val();
$("#type"+type+" .opacity").change(function(){
	opacity = $("#type"+type+" .opacity").val();
	chooseMap();
})


//省级等级符号地图 工具箱初始化
var circleNum = $("#type3 select").val();	//省级等级符号地图 符号个数
$("#type3 .moreColor .minicolors:gt("+(circleNum-1)+")").hide();
$("#type3 select").change(function(){
	circleNum = $("#type3 select").val();
	$("#type3 .moreColor .minicolors").show();
	$("#type3 .moreColor .minicolors:gt("+(circleNum-1)+")").hide();
})
var circleColor = [];
$("#type3 .moreColor .minicolors .colorPick").each(function(){
    circleColor.push($(this).val());
});
circleColor = circleColor.slice(0, circleNum);
$("#type3 .moreColor .minicolors .colorPick").change(function(){
	circleColor.length = 0;
	$("#type3 .moreColor .minicolors input[type='text']").each(function(){
	    circleColor.push($(this).val());
	});
	if (circleColor[circleNum-1] !== "") {
		circleColor = circleColor.slice(0, circleNum);
		chooseMap();
	}
})


//省级柱状统计地图 工具箱初始化
var barWidth = $("#type"+type+" .barWidth").val();
$("#type"+type+" .barWidth").change(function(){
	barWidth = Number($("#type"+type+" .barWidth").val());
	chooseMap();
});
var maxBarHeight = $("#type"+type+" .maxBarHeight").val();
$("#type"+type+" .maxBarHeight").change(function(){
	maxBarHeight = Number($("#type"+type+" .maxBarHeight").val());
	chooseMap();
});
var barColor = $("#type"+type+" .barColor").val();
$("#type"+type+" .barColor").change(function(){
	barColor = $("#type"+type+" .barColor").val();
	chooseMap();
});


//省级饼状对比地图 工具箱初始化
$("#type5 .moreColor .minicolors:gt("+(thLenght-2)+")").hide();
var pointColor = $("#type5 .pointColor").val();
$("#type5 .pointColor").change(function(){
	pointColor = $("#type5 .pointColor").val();
	chooseMap();
});
var pieColor = [];
$("#type5 .moreColor .minicolors .colorPick").each(function(){
    pieColor.push($(this).val());
});
pieColor = pieColor.slice(0, thLenght);
$("#type5 .moreColor .minicolors .colorPick").change(function(){
	pieColor.length = 0;
	$("#type5 .moreColor .minicolors input[type='text']").each(function(){
	    pieColor.push($(this).val());
	});
	if (pieColor[thLenght-2] !== "") {
		pieColor = pieColor.slice(0, thLenght);
		chooseMap();
	}
})


//省级柱状对比地图 工具箱初始化
$("#type6 .moreColor .minicolors:gt("+(thLenght-2)+")").hide();


d3.json("/data/china.json",function(t, e) {			//读取地图数据，绘制地图
	if (t) return console.error(t);
	geodata = topojson.feature(e, e.objects.china);
	d3.select("#type"+type).style("display","block");	//根据选择的地图类型，显示对应的工具箱
	chooseMap();
});


$(".reset").click(function(){
	window.location.reload()
})


function chooseMap() {
	if (type == 1) {
		showMap();
	} else if (type == 2) {
		showMap();
		drawColor();
	} else if (type == 3) {
		showMap();
		drawCircle();
	}else if(type == 4){
		showMap();
		drawBar();
	}
	else if(type==5){
		showMap();
		drawPie();
	}else if(type ==6){
		showMap();
		drawContrastBar();
	}
}


function showMap() {
	getValues(csvdata,indexCol);
	d3.selectAll('svg').remove();
	svg = d3.select("#main").append("svg").attr("width", width).attr("height", height).style("background-color", bgColor).call(zoom);
	china = svg.append("g");
	provinces = china.selectAll("path").data(geodata.features).enter().append("path")
				.attr("d", path).attr("fill", mapColor).attr("stroke", "#fff").attr("stroke-width", .2)
				.on("mousemove",function(t) {
					d3.select("#tooltip").style("top", d3.event.pageY + 10 + "px").style("left", d3.event.pageX + 20 + "px").select("#data-name-tooltip").text(t.properties.name),
					d3.select("#tooltip").select("#data-value-tooltip").text(values[t.properties.name]),
					d3.select("#data-name").text(titles[0]),
					d3.select("#data-value").text(titles[indexCol]),
					d3.select("#tooltip").classed("hidden", !1)
				}).on("mouseout",function() {
					d3.select("#tooltip").classed("hidden", !0)
				});
	china.selectAll("text").data(geodata.features).enter().append("text").attr("transform",function(d, i) {
		if (d.properties.id == "20") {
			return "translate(" + (path.centroid(d)[0] - 20) + "," + (path.centroid(d)[1] + 20) + ")"
		} else if (d.properties.id == "24") {
			return "translate(" + (path.centroid(d)[0] - 5) + "," + (path.centroid(d)[1] + 10) + ")"
		} else if (d.properties.id == "32") {
			return "translate(" + (path.centroid(d)[0]) + "," + (path.centroid(d)[1] + 10) + ")"
		} else if (d.properties.id == "33") {
			return "translate(" + (path.centroid(d)[0] - 15) + "," + (path.centroid(d)[1] + 20) + ")"
		}
		return "translate(" + (path.centroid(d)[0] - 10) + "," + path.centroid(d)[1] + ")"
	}).text(function(d) {
		return d.properties.name
	}).attr("font-size", 12);
	china.append("svg:image").attr("xlink:href", "images/southchinasea.png").attr({
		x: width * 0.8,
		y: height * 0.8,
		"width": 50,
		"height": 70
	});
}

function sort(a, b) {
	if (isNaN(Number(a))) {
		return a > b ? 1 : a == b ? 0 : -1
	} else {
		a = Number(a);
		b = Number(b);
		return a > b ? 1 : a == b ? 0 : -1
	}
}

function transform(obj) {
	var arr = [];
	for (var item in obj) {
		arr.push(obj[item])
	}
	return arr;
}
function getValues(csvdata,indexCol) {
	valuesNum.length = 0;
	for (var i = 0; i < csvdata.length; i++) {
		var arr = transform(csvdata[i]);
		var name = arr[0];
		var value = arr[indexCol];
		values[name] = Number(value);
		valuesNum.push(Number(value));
	} 
}
var zoom = d3.behavior.zoom().scaleExtent([1, 10]).on("zoom", zoomed);
function zoomed() {
	china.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")")
}

function drawColor() {
	getValues(csvdata,indexCol);
	var maxvalue = d3.max(valuesNum);
	var minvalue = d3.min(valuesNum);
	var linear = d3.scale.linear().domain([minvalue, maxvalue]).range([0, 1]);
	var a = pColor[1];
	var b = pColor[0];
	var computeColor = d3.interpolate(a, b);
	provinces.style("fill", function(d,i){
				var t = linear( values[d.properties.name] );
				var color = computeColor(t);
				return color.toString();
			});
	var defs = svg.append("defs");
	var linearGradient = defs.append("linearGradient").attr("id", "linearColor").attr("x1", "0%").attr("y1", "0%").attr("x2", "100%").attr("y2", "0%");
	var stop1 = linearGradient.append("stop").attr("offset", "0%").style("stop-color", a);
	var stop2 = linearGradient.append("stop").attr("offset", "100%").style("stop-color", b);
	var colorRect = svg.append("rect").attr("x", 20).attr("y", 490).attr("width", 150).attr("height", 30).style("fill", "url(#" + linearGradient.attr("id") + ")");
	var minValueText = svg.append("text").attr("x", 20).attr("y", 490).attr("dy", "-0.3em").text(function() {
		return minvalue;
	});
	var maxValueText = svg.append("text").attr("x", 160).attr("y", 490).attr("dy", "-0.3em").text(function() {
		return maxvalue;
	})
}

function drawCircle() {
	getValues(csvdata,indexCol);
	// d3.selectAll('text').remove();
	var maxvalue = d3.max(valuesNum);
	var minvalue = d3.min(valuesNum);
	var valueArray = getValueArray(maxvalue, minvalue, circleNum);

	changeColorStyle(circleNum);

	function getValueArray(max, min, circleNum) {
		var arr = [];
		arr[0] = min;
		interval = Math.floor((maxvalue - minvalue + 1) / circleNum);
		for (var i = 1; i < circleNum; i++) {
			arr[i] = arr[i - 1] + interval
		}
		return arr;
	}
	function computeColor(valueArray, t) {
		var rColor;
		for (var i = 0; i < valueArray.length; i++) {
			var min = valueArray[i];
			var max = valueArray[i + 1];
			if (t >= min && t < max) {
				rColor = circleColor[i];
				break;
			}
			rColor = circleColor[valueArray.length - 1]
		}
		return rColor;
	}
	function computeRadius(valueArray, t) {
		var radius = 4;
		for (var i = 0; i < valueArray.length; i++) {
			var min = valueArray[i];
			if (t >= min) {
				radius += 4
			}
		}
		return radius
	}
	function changeColorStyle(circleNum) {
		china.selectAll("circle").data(geodata.features).enter().append("circle").attr("transform",function(d) {
			return "translate(" + (path.centroid(d)[0] + 5) + "," + path.centroid(d)[1] + 10 + ")"
		}).attr("r",function(d, i) {
			var t = values[d.properties.name];
			var radius = computeRadius(valueArray, t);
			return radius.toString();
		}).attr("fill",function(d, i) {
			var t = values[d.properties.name];
			var color = computeColor(valueArray, t);
			return color;
		}).style("opacity", opacity);
		drawRectText(circleNum, valueArray);
	}
	function drawRectText(circleNum, valueArray) {
		var cx = 20;
		var cy = 20;
		for (var i = 0; i < circleNum; i++) {
			svg.append("rect").attr("x", cx).attr("y", cy).attr("width", 30).attr("height", 15).style("fill", computeColor(valueArray, valueArray[i]));
			svg.append("text").attr("x", cx + 35).attr("y", cy + 15).text(function() {
				return valueArray[i] + " ~ " + (valueArray[i] + interval - 1)
			});
			cy = cy + 20;
		}
	}
}

function drawBar(){
	getValues(csvdata,indexCol);
	// d3.selectAll('text').remove();
	var maxvalue = d3.max(valuesNum);
	var minvalue = d3.min(valuesNum);

	var ratio = (maxvalue-minvalue)/maxBarHeight;

	china.selectAll("rect").data(geodata.features).enter().append("rect").attr("transform",function(d) {
			var t = values[d.properties.name];
			return "translate(" + (path.centroid(d)[0]) + "," + (path.centroid(d)[1]-computebarHeight(t)) + ")"
		}).attr("width", barWidth+"px")
		.attr("fill",barColor)
		.attr("height", function(d) {
			var t = values[d.properties.name];
			var barheight = computebarHeight(t);
          	return barheight+"px";
         }).style("opacity", opacity);
		function computebarHeight(t) {
			if (t) {
	      	    return (t-minvalue)/ratio;
	      	} else {
	      	    return 0;
	      	}
		}
}

function drawPie(){
	var arc = d3.svg.arc()
			.innerRadius(0)
			.outerRadius(35);  //新建一个弧度生成器
			
	var pie = d3.layout.pie()
				.sort(null)
				.value(function(d) { return d; });  //构造一个新的默认的饼布局。
				
	var points = china.selectAll("g")
		.data(geodata.features)
		.enter()
		.append("g")
		.attr("transform",function(d) { return "translate(" + (path.centroid(d)[0]) + "," + path.centroid(d)[1] +10 + ")" })
		.attr("class", function(d,i) { return "pies toggle toggle"+i; })
		.attr("visibility", "hidden");

	points.append("circle")
		.attr("r",5)
		.attr("visibility","visible")
		.on("click", function(d,i) { 
			d3.selectAll(".toggle"+i).attr('visibility','visible');	
		})
		.style("display","inline")
		.style("cursor","pointer").attr("fill",pointColor);
		console.log(pointColor)

	var pies = points.selectAll(".pies").data(function(d) { 
			var placename = d.properties.name;
			piedata = [];
			for (var i = 0; i < csvdata.length; i++) {
				if (csvdata[i][titles[0]] == placename) {
					for(var j = 1; j < titles.length; j++){
						piedata.push(csvdata[i][titles[j]]);
					}
				}
			}
			return pie(piedata); 
		})
		.enter()
		.append('g')
		.attr('class','arc');

	var piepath = pies.append("path")
	  .attr('d',arc)
      .attr("fill",function(d,i){ return pieColor[i]; })
      .on("mousemove",function(d,i) {
      	console.log(d);
		d3.select("#tooltip").style("top", d3.event.pageY + 10 + "px").style("left", d3.event.pageX + 20 + "px")
		  .select("#data-value-tooltip").text(
				function(){
					var a = (d.endAngle - d.startAngle)/(2*Math.PI);
					return a.toFixed(2)+"%";

				});
		d3.select("#tooltip").select("#data-name-tooltip").text(d.value);
		d3.select("#data-value").text("占比");
		d3.select("#data-name").text(titles[i+1]);
		d3.select("#tooltip").classed("hidden", !1);
	}).on("mouseout",function() {
		d3.select("#tooltip").classed("hidden", !0)
	});

    drawPieRectText(titles, pieColor);
    function drawPieRectText(titles, pieColor) {
		var cx = 20;
		var cy = 20;
		for (var i = 1; i < titles.length; i++) {
			svg.append("rect").attr("x", cx).attr("y", cy).attr("width", 30).attr("height", 15).style("fill", pieColor[i-1]);
			svg.append("text").attr("x", cx + 35).attr("y", cy + 15).text(function() {
				return titles[i]
			});
			cy = cy + 20;
		}
	}
}






function drawContrastBar(){
	var tabledata = getTableContent("#table");
	function getTableContent(id){
	    var mytable = $("#table table")[0];
	    var data = [];
	    for(var i=1,rows=mytable.rows.length; i<rows; i++){
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
	console.log(maxBarHeight)
	var barwidth = 15;

	var bin_num = titles.length-1;  
	histogram=d3.layout.histogram()  
	    .range(titles) //区间范围  
	    .bins(bin_num) //分隔数  
	    // .frequency(true)//true:统计个数；false:统计概率  

	var max_height = maxBarHeight;  
	var rect_step = barwidth;  
	 
	var yScale = d3.scale.linear()
				  .domain([0, maxvalue])
				  .range([maxBarHeight, 0]);

	var ratio = (maxvalue-minvalue)/maxBarHeight;
		function computebarHeight(d) {
			if (d) {
	      	    return (d-minvalue)/ratio;
	      	} else {
	      	    return 0;
	      	}
		}

	var points = china.selectAll("g")
		.data(geodata.features)
		.enter()
		.append("g")
		.attr("transform",function(d) { return "translate(" + (path.centroid(d)[0]) + "," + path.centroid(d)[1] +10 + ")" })
		.attr("class", function(d,i) { return "bars toggle toggle"+i; })
		.attr("visibility", "hidden");

	points.append("circle")
		.attr("r",5)
		.attr("visibility","visible")
		.on("click", function(d,i) { 
			d3.selectAll(".toggle"+i).attr('visibility','visible');	
		})
		.style("display","inline")
		.style("cursor","pointer");

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
			
			return barsdata; 
		})
		.enter()
		.append('rect')
		.attr("x",function(d,i){  
            return (i-Math.floor(titles.length/2)) * rect_step ;   
        })  
        .attr("y", function(d,i){  
            return yScale(d)-maxBarHeight;  
        })  
        .attr("width", function(d,i){  
            return rect_step - 2;   
        })  
        .attr("height", function(d){  
            return computebarHeight(d);  
        })  
        .attr("fill",function(d,i){return pieColor[i]})
        .on("mousemove",function(d,i) {
			d3.select("#tooltip").style("top", d3.event.pageY + 10 + "px").style("left", d3.event.pageX + 20 + "px")
			  .select("#data-value-tooltip").text(d);
			d3.select("#data-value").text(titles[i+1]);
			d3.select("#tooltip").classed("hidden", !1);
		}).on("mouseout",function() {
			d3.select("#tooltip").classed("hidden", !0)
		});

		drawPieRectText(titles, pieColor);
    function drawPieRectText(titles, pieColor) {
		var cx = 20;
		var cy = 20;
		for (var i = 1; i < titles.length; i++) {
			svg.append("rect").attr("x", cx).attr("y", cy).attr("width", 30).attr("height", 15).style("fill", pieColor[i-1]);
			svg.append("text").attr("x", cx + 35).attr("y", cy + 15).text(function() {
				return titles[i]
			});
			cy = cy + 20;
		}
	}

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
		for (var c = 0; c < parentElement.classList.length; c++) if (!contains('.' + parentElement.classList[c], selectorTextArr)) selectorTextArr.push('.' + parentElement.classList[c]);
		var nodes = parentElement.getElementsByTagName("*");
		for (var i = 0; i < nodes.length; i++) {
			var id = nodes[i].id;
			if (!contains('#' + id, selectorTextArr)) selectorTextArr.push('#' + id);
			var classes = nodes[i].classList;
			for (var c = 0; c < classes.length; c++) if (!contains('.' + classes[c], selectorTextArr)) selectorTextArr.push('.' + classes[c])
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
				if (contains(cssRules[r].selectorText, selectorTextArr)) extractedCSSText += cssRules[r].cssText
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




function showTable() {
	var sortAscending = true;
	var table = d3.select('#table').append('table');
	titles = d3.keys(csvdata[0]);
	var headers = table.append('thead').append('tr').selectAll('th').data(titles).enter().append('th').text(function(d) {
		return d
	}).on('click',function(d) {
		if (sortAscending) {
			rows.sort(function(a, b) {
				return sort(b[d], a[d])
			});
			sortAscending = false;
			this.className = 'aes';
			$(this).siblings().removeClass();
		} else {
			rows.sort(function(a, b) {
				return sort(a[d], b[d])
			});
			sortAscending = true;
			this.className = 'des';
			$(this).siblings().removeClass();
		}
		var innertext = this.innerText;
		for (var i = 0; i < titles.length; i++) {
			if (titles[i] == innertext) {
				indexCol = i;
				chooseMap();
			}
		}
	});
	var rows = table.append('tbody').selectAll('tr').data(csvdata).enter().append('tr');
	rows.selectAll('td').data(function(d) {
		return titles.map(function(k) {
			return {
				'value': d[k],
				'name': k
			}
		})
	}).enter().append('td').attr('data-th',function(d) {
		return d.name
	}).text(function(d) {
		return d.value
	});
}