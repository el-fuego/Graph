Graph
===========
<b>Построение графиков в виде линий, столбцовых и круговых дигарамм.</b>


JavaScript + SVG + CSS<br />
Libs: jQuery, Lodash/Underscore

* 9kb unzipped JS + 1kb CSS
* Поддержка http://caniuse.com/#search=svg
* Использование CSS для определения стилей
* Установка дополнительных аттрибутов к DOM-объектам
* Возможность установки событий на элементы графиков

<img src="http://cs314117.vk.me/v314117782/231/mX4M_HC5jPY.jpg" />

<b>Пример использования:</b>
<pre>
// Круговая диаграмма
var myGraph = new Graph ({
      el:    'body',
      width:  300,
      height: 300
});

var svgSectors = myGraph.renderCircleDiagram([2, 5, 7, 3, 5]);
</pre>


<pre>
// Линейный график
new Graph ({
      el:    'body',
}).renderLine([2, 5, 7, 3, 5]);

// Столбцовая диаграмма
new Graph ({
      el:    'body',
}).renderDiagram([2, 5, 7, 3, 5]);
</pre>

