var type = 1;
var margin = {top: 10,left: 10,bottom: 10,right: 10};
var width = $("#main").width();
	width = width - margin.left - margin.right;
var mapRatio = 0.75;
var height = width * mapRatio;
var mapRatioAdjuster = 0.1;
var chinaCenter = [105, 35];

var projection = d3.geo.mercator().center(chinaCenter).translate([width / 2, height / 2]).scale(width * mapRatio);
var path = d3.geo.path().projection(projection);


var indexCol = 1, 	//表格列数
	values = [],	//一列表格数据 地区名称-数据
	valuesNum = [];	//一列表格数据 数据

var csvdata = [];

var parameter = [];
$("#type-select").change(function(){
	type = $(this).find("option:selected").attr("title");
	$("#type"+type).show().siblings().hide();
	$("#type"+type+" input").each(function(key,value){
     	parameter[key] = $(this).val();
     	for(var i = 0 ;i<parameter.length;i++){
	         if(parameter[i] == "" || typeof(parameter[i]) == "undefined"){
	                  parameter.splice(i,1);
	                  i= i-1;	              
	         }           
		 }
	});
	circle = $(".circle").val(); 
	$("#type3 .minicolors:gt("+(circle-1)+")").hide();
	$("#type5 .minicolors:gt("+(titles.length-1)+")").hide();
	$("#type6 .minicolors:gt("+(titles.length-1)+")").hide();
	chooseMap();
});

var main = [];
$("#collapse1 input").each(function(key,value){
     main[key] = $(this).val();
});
$("#collapse1 input").change(function(){
	$("#collapse1 input").each(function(key,value){
     	main[key] = $(this).val();
	});
	chooseMap();
});

$("#collapse2 input").change(function(){
	parameter.length = 0;
	$("#collapse2 input:visible").each(function(key,value){
     	parameter[key] = $(this).val();
	});
	chooseMap();
});
$(".circle").change(function(){
	circle = $(".circle").val(); 
	$("#type3 .minicolors").show();
	$("#type3 .minicolors:gt("+(circle-1)+")").hide();
});


$("#reset").click(function(){
	window.location.reload();
});
$('#upload').bind('change', handleFileSelect);
function handleFileSelect(evt) {
  var files = evt.target.files;
  var file = files[0];
  getTableData(file);
}
function getTableData(file) {
  var reader = new FileReader();
  reader.readAsText(file);
  reader.onload = function(event){
   	csv = event.target.result;
   	csvdata = d3.csv.parse(csv);
   	showTable();
  };
  reader.onerror = function(){ alert('Unable to read' + file.fileName); };
}



function showTable() {
	var sortAscending = true;
	var table = d3.select('#table').append('table').attr("class","table table-striped table-bordered table-hover table-condensed");
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
	$("#type5 .minicolors:gt("+(titles.length-1)+")").hide();
	$("#type6 .minicolors:gt("+(titles.length-1)+")").hide();
	chooseMap();
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


d3.json("/data/china.json",function(t, e) {			//读取地图数据，绘制地图
	if (t) return console.error(t);
	geodata = topojson.feature(e, e.objects.china);
	chooseMap();
});

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
	svg = d3.select("#main").append("svg").attr("width", width).attr("height", height).style("background-color", main[0]).call(zoom);
	china = svg.append("g");
	titles = d3.keys(csvdata[0]);
	thLenght = titles.length;
	provinces = china.selectAll("path").data(geodata.features).enter().append("path")
				.attr("d", path).attr("fill", main[1]).style("opacity", main[2]).attr("stroke", main[4]).attr("stroke-width", main[3])
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
	}).attr("font-size", main[5]);
	china.append("svg:image").attr("xlink:href", "images/southchinasea.png").attr({
		x: width * 0.75,
		y: height * 0.73,
		"width": 50,
		"height": 70
	});
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
	var a = parameter[1];
	var b = parameter[0];
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
	var colorRect = svg.append("rect").attr("x", parameter[2]).attr("y", parameter[3]).attr("width", parameter[4]).attr("height", parameter[5]).style("fill", "url(#" + linearGradient.attr("id") + ")");
	var minValueText = svg.append("text").attr("x", parameter[2]).attr("y", parameter[3]).attr("dy", "-0.3em").text(function() {
		return minvalue;
	});
	var maxValueText = svg.append("text").attr("x", Number(parameter[2])+Number(parameter[4])-10).attr("y", parameter[3]).attr("dy", "-0.3em").text(function() {
		return maxvalue;
	})
}

function drawCircle() {
	getValues(csvdata,indexCol);
	// d3.selectAll('text').remove();
	var maxvalue = d3.max(valuesNum);
	var minvalue = d3.min(valuesNum);
	var valueArray = getValueArray(maxvalue, minvalue, circle);

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
		}).style("opacity", parameter[circle]);
	drawRectText(circle, valueArray);

	function getValueArray(max, min, circle) {
		var arr = [];
		arr[0] = min;
		interval = Math.floor((maxvalue - minvalue + 1) / circle);
		for (var i = 1; i < circle; i++) {
			arr[i] = arr[i - 1] + interval
		}
		return arr;
	}
	function computeColor(valueArray, t) {
		var rColor;
		console.log(parameter)
		for (var i = 0; i < valueArray.length; i++) {
			var min = valueArray[i];
			var max = valueArray[i + 1];
			if (t >= min && t < max) {
				rColor = parameter[i];
				break;
			}
			rColor = parameter[valueArray.length - 1]
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
	function drawRectText(circle, valueArray) {
		var cx = Number(parameter[parameter.length-6]);
		var cy = Number(parameter[parameter.length-5]);
		var cWidth = Number(parameter[parameter.length-4]);
		var cHeight = Number(parameter[parameter.length-3]);
		var xStep = Number(parameter[parameter.length-2]);
		var yStep = Number(parameter[parameter.length-1]);
		for (var i = 0; i < circle; i++) {
			svg.append("rect").attr("x", cx).attr("y", cy).attr("width", cWidth).attr("height",cHeight).style("fill", computeColor(valueArray, valueArray[i]));
			svg.append("text").attr("x", cx + cWidth + xStep).attr("y", cy + cHeight).text(function() {
				return valueArray[i] + " ~ " + (valueArray[i] + interval - 1)
			});
			cy = cy + yStep;
		}
	}
}

function drawBar(){
	getValues(csvdata,indexCol);
	// d3.selectAll('text').remove();
	var maxvalue = d3.max(valuesNum);
	var minvalue = d3.min(valuesNum);

	var maxBarHeight = Number(parameter[1]);
	var barWidth = Number(parameter[0]);

	var ratio = (maxvalue-minvalue)/maxBarHeight;

	china.selectAll("rect").data(geodata.features).enter().append("rect").attr("transform",function(d) {
			var t = values[d.properties.name];
			return "translate(" + (path.centroid(d)[0]) + "," + (path.centroid(d)[1]-computebarHeight(t)) + ")"
		}).attr("width", barWidth+"px")
		.attr("fill",parameter[2])
		.attr("height", function(d) {
			var t = values[d.properties.name];
			var barheight = computebarHeight(t);
          	return barheight+"px";
         }).style("opacity", parameter[3]);
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
		.attr("r",parameter[2])
		.attr("visibility","visible")
		.on("click", function(d,i) { 
			d3.selectAll(".toggle"+i).attr('visibility','visible');	
		})
		.style("display","inline")
		.style("cursor","pointer").attr("fill",parameter[0]).attr("opacity",parameter[1]);

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

	var piepath = pies.append("path").attr('d',arc)
      .attr("fill",function(d,i){ return parameter[i+3];})
      .on("click",function(d,i) {
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
	});
    drawPieRectText(titles, parameter);
    function drawPieRectText(titles, parameter) {
		var cx = Number(parameter[parameter.length-6]);
		var cy = Number(parameter[parameter.length-5]);
		var cWidth = Number(parameter[parameter.length-4]);
		var cHeight = Number(parameter[parameter.length-3]);
		var xStep = Number(parameter[parameter.length-2]);
		var yStep = Number(parameter[parameter.length-1]);
		for (var i = 1; i < titles.length; i++) {
			svg.append("rect").attr("x", cx).attr("y", cy).attr("width", cWidth).attr("height", cHeight).style("fill", parameter[i+2]);
			svg.append("text").attr("x", cx + cWidth + xStep).attr("y", cy + cHeight).text(function() {
				return titles[i]
			});
			cy = cy + yStep;
		}
	}
}






function drawContrastBar(){
	console.log(parameter)
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

	var bin_num = titles.length-1;  

	var maxBarHeight = Number(parameter[4]);  
	var rect_step = Number(parameter[3]); ;  
	 
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
		.attr("r",parameter[2])
		.attr("visibility","visible")
		.on("click", function(d,i) { 
			d3.selectAll(".toggle"+i).attr('visibility','visible');	
		})
		.style("display","inline")
		.style("cursor","pointer").attr("fill",parameter[0]).attr("opacity",parameter[1]);

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
        .attr("fill",function(d,i){return parameter[i+5]})
        .on("mousemove",function(d,i) {
			d3.select("#tooltip").style("top", d3.event.pageY + 10 + "px").style("left", d3.event.pageX + 20 + "px")
			  .select("#data-value-tooltip").text(d);
			d3.select("#data-value").text(titles[i+1]);
			d3.select("#tooltip").classed("hidden", !1);
		}).on("mouseout",function() {
			d3.select("#tooltip").classed("hidden", !0)
		});

		drawPieRectText(titles, parameter);
    function drawPieRectText(titles, parameter) {
		var cx = Number(parameter[parameter.length-6]);
		var cy = Number(parameter[parameter.length-5]);
		var cWidth = Number(parameter[parameter.length-4]);
		var cHeight = Number(parameter[parameter.length-3]);
		var xStep = Number(parameter[parameter.length-2]);
		var yStep = Number(parameter[parameter.length-1]);
		for (var i = 1; i < titles.length; i++) {
			svg.append("rect").attr("x", cx).attr("y", cy).attr("width", cWidth).attr("height", cHeight).style("fill", parameter[i+4]);
			svg.append("text").attr("x", cx + cWidth + xStep).attr("y", cy + cHeight).text(function() {
				return titles[i]
			});
			cy = cy + yStep;
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
