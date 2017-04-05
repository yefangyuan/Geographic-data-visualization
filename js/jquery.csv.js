/*
 * csv文件加载 扩展
 * @author 周靖杰
 * @date 2013/5/31
 */
$.extend({
    csv: function (url, f) {
        $.get(url, function (record) {
            //按回车拆分
            record = record.split(/\n/);
            //第一行标题
            var title = record[0].split(",");
            //删除第一行
            record.shift();
            var data = [];
            for (var i = 0; i < record.length; i++) {
                var t = record[i].split(",");
                for (var y = 0; y < t.length; y++) {
                    if (!data[i]) data[i] = {};
                    data[i][title[y]] = t[y];
                }
            }
            f.call(this, data);
            data = null;
        });
    }
});