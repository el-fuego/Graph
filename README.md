Graph
===========

Построение графиков в виде линий, столбцовых и круговых дигарамм.<br />
JavaScript + SVG + CSS<br />
Libs: jQuery, Lodash/Underscore

* Поддержка http://caniuse.com/#search=svg
* Использование CSS для определения стилей
* Установка дополнительных аттрибутов к DOM-объектам



Пример использования:
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