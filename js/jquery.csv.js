/*
 * csv�ļ����� ��չ
 * @author �ܾ���
 * @date 2013/5/31
 */
$.extend({
    csv: function (url, f) {
        $.get(url, function (record) {
            //���س����
            record = record.split(/\n/);
            //��һ�б���
            var title = record[0].split(",");
            //ɾ����һ��
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