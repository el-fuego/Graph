module.exports = function (grunt) {

    /**
     * Настройки
     */
    grunt.initConfig({


        /**
         * Сборка JS
         */
        concat: {
            'graph.js':  'source/*.js'
        },

        /**
         * Минификация JS
         */
        uglify: {
            options: {
                compress: true,
                report:   false
            },
            js: {
                'src':  'graph.js',
                'dest': 'graph.min.js'
            }
        },


        /**
         * Архивирование JS
         */
        compress: {
            js: {
                options: {
                    archive: 'graph.zip'
                },
                src: [
                    'graph.min.js',
                    'graph.css',
                    'sample.html'
                ],
                dest:    './'
            }
        },


        /**
         * Автосборка по изменению файла
         */
        watch: {
            files: [
                'source/*.js',
                '*.{html,css}'
            ],
            tasks: [
                'concat',
                'uglify',
                'compress'
            ],
            options: {
                nospawn: true
            }
        }
    });

    /**
     * Используемые модули
     */
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-watch');

    /**
     * Сборка JS-интерфейса
     */
    grunt.registerTask('default', [
        'concat', 'uglify', 'compress'//, 'watch'
    ]);
};
