const Form2Yaml =  require("../lib/index.js");

const defaultYaml = [
    'meta:',
    '  name: test  #注释',
    '  namespace: default',
    '  #注释',
    '  description: 描述信息'
].join('\n');

describe("setJson", () => {
    it("json和yaml数据完全一致", ()=> {
        let form2yaml = new Form2Yaml(defaultYaml)
        form2yaml.setJson({
            meta:{
                name: 'test2',
                namespace: 'default2',
                description: '描述信息2'
            }
        })

        let yaml = [
            'meta:',
            '  name: test2  #注释',
            '  namespace: default2',
            '  #注释',
            '  description: 描述信息2'
        ].join('\n')
        expect(form2yaml.getYaml()).toEqual(yaml)
    })

    it("json内容比yaml少，保留yaml多余数据", ()=> {
        let form2yaml = new Form2Yaml(defaultYaml)
        form2yaml.setJson({
            meta:{
                name: 'test2',
                namespace: 'default2'
            }
        })

        let yaml = [
            'meta:',
            '  name: test2  #注释',
            '  namespace: default2',
            '  #注释',
            '  description: 描述信息'
        ].join('\n')
        expect(form2yaml.getYaml()).toEqual(yaml)
    })

    it("json内容比yaml少，不保留yaml多余数据", ()=> {
        let form2yaml = new Form2Yaml(defaultYaml, {
            mergeJsonOfYaml: false
        })
        form2yaml.setJson({
            meta:{
                name: 'test2',
                namespace: 'default2'
            }
        })

        let yaml = [
            'meta:',
            '  name: test2  #注释',
            '  namespace: default2',
            '  #注释'
        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })
    it("json内容比yaml多，添加到yaml中", ()=> {
        let form2yaml = new Form2Yaml(defaultYaml)
        form2yaml.setJson({
            meta:{
                name: 'test2',
                namespace: 'default2',
                description: '描述信息2',
                extra: '内部多余的属性'
            },
            extra: '外部多余属性'
        })

        let yaml = [
            'meta:',
            '  name: test2  #注释',
            '  namespace: default2',
            '  #注释',
            '  description: 描述信息2',
            '  extra: 内部多余的属性',
            'extra: 外部多余属性'

        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })

    it("json内容比yaml多，不添加到yaml中", ()=> {
        let form2yaml = new Form2Yaml(defaultYaml, {
            ignoreExtra: true
        })
        form2yaml.setJson({
            meta:{
                name: 'test2',
                namespace: 'default2',
                description: '描述信息2',
                extra: '内部多余的属性'
            },
            extra: '外部多余属性'
        })

        let yaml = [
            'meta:',
            '  name: test2  #注释',
            '  namespace: default2',
            '  #注释',
            '  description: 描述信息2'

        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })

    it("json中字段空值时删除该字段", ()=> {
        let form2yaml = new Form2Yaml(defaultYaml, {
        })
        form2yaml.setJson({
            meta:{
                name: undefined,
                namespace: undefined,
                description: undefined
            }
        })

        let yaml = [
            'meta:',
            '  #注释',

        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })
    it("json中字段空值时保留该字段", ()=> {
        let form2yaml = new Form2Yaml(defaultYaml, {
            keyMap:{
                'name': 'meta.name'
            },
            emptyMode: {
                'meta.name': 'retain',
                'meta.namespace': 'delete',
                'meta.description': 'retain'
            },
        })
        form2yaml.setJson({
            name: undefined,
            meta:{
                namespace: undefined,
                description: undefined
            }
        })

        let yaml = [
            'meta:',
            '  name:   #注释',
            '  #注释',
            '  description:'
        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })

    it("json中初始为空对象", ()=> {
        let form2yaml = new Form2Yaml('a: 1\nmeta: {\n\n}\nb: 2')
        form2yaml.setJson({
            meta:{
                a: 1,
                b: 2
            }
        })

        let yaml = [
            'a: 1',
            'meta:',
            '  a: 1',
            '  b: 2',
            'b: 2'
        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })

    it("json中初始为空数组", ()=> {
        let form2yaml = new Form2Yaml('a: 1\nmeta: [\n\n]\nb: 2')
        form2yaml.setJson({
            meta: [5, 6]
        })

        let yaml = [
            'a: 1',
            'meta:',
            '  - 5',
            '  - 6',
            'b: 2'
        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })
    it("原来是非对象的值，后来设为对象", ()=> {
        let form2yaml = new Form2Yaml('a: 1')
        form2yaml.setJson({
            a: {
                b: {
                    c: 3
                }
            }
        })

        let yaml = [
            'a:',
            '  b:',
            '    c: 3'
        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })
    it("原来是非对象的值，后来设为数组", ()=> {
        let form2yaml = new Form2Yaml('a: 1')
        form2yaml.setJson({
            a: [1, 2]
        })

        let yaml = [
            'a:',
            '  - 1',
            '  - 2'
        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })
    it("原来是对象，后来设为非对象数组", ()=> {
        let form2yaml = new Form2Yaml('a: \n  b: 1')
        form2yaml.setJson({
            a: 1
        })

        let yaml = [
            'a: 1',
        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })
    it("原来是数组，后来设为非对象数组", ()=> {
        let form2yaml = new Form2Yaml('a: \n  - 1')
        form2yaml.setJson({
            a: 1
        })

        let yaml = [
            'a: 1',
        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })

    it("原来是行内对象，后来设为非对象数组", ()=> {
        let form2yaml = new Form2Yaml('a: {b: 1}')
        form2yaml.setJson({
            a: 1
        })

        let yaml = [
            'a: 1',
        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })
    it("原来是对象，后来设为数组", ()=> {
        let form2yaml = new Form2Yaml('a: {b: 1}')
        form2yaml.setJson({
            a: [1, 2]
        })

        let yaml = [
            'a:',
            '  - 1',
            '  - 2'
        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })

    it("原来是空数组，后来设为非空数组", ()=> {
        let form2yaml = new Form2Yaml('a: []')
        form2yaml.setJson({
            a: [1, 2]
        })

        let yaml = [
            'a:',
            '  - 1',
            '  - 2'
        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })
    it("原来是非空数组，后来设为空数组", ()=> {
        let form2yaml = new Form2Yaml('a: \n  - 1')
        form2yaml.setJson({
            a: []
        })

        let yaml = [
            'a: []',
        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })

    it("原来是空对象，后来设为非空对象", ()=> {
        let form2yaml = new Form2Yaml('a: {}')
        form2yaml.setJson({
            a: {b:1, c:1}
        })

        let yaml = [
            'a:',
            '  b: 1',
            '  c: 1'
        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })
    it("原来是非空对象，后来设为空对象", ()=> {
        let form2yaml = new Form2Yaml('a:\n  b: 1', {
            mergeJsonOfYaml: false
        })
        form2yaml.setJson({
            a: {}
        })

        let yaml = [
            'a: {}'
        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })

    it("原来是单行字符，后来设为多行字符", ()=> {
        let form2yaml = new Form2Yaml('a: 1', {
            mergeJsonOfYaml: false
        })
        form2yaml.setJson({
            a: '1\n\n\n2'
        })

        let yaml = [
            'a: |-',
            '  1',
            '',
            '',
            '  2'
        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })

    it("原来是多行字符，后来设为单行字符", ()=> {
        let form2yaml = new Form2Yaml('a: |-\n  1\n  2', {
            mergeJsonOfYaml: false
        })
        form2yaml.setJson({
            a: '2'
        })

        let yaml = [
            'a: 2'
        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })
    it("原来某个子属性是单行字符，后来设为多行字符", () => {
        let form2yaml = new Form2Yaml('a:\n  b: 1', {
            mergeJsonOfYaml: false
        });
        form2yaml.setJson({
            a: {
                b: '1\n2'
            }
        });

        let yaml = [
            'a:',
            '  b: |-',
            '    1',
            '    2'
        ].join('\n');
        expect(form2yaml.getYaml().trim()).toEqual(yaml);
    });
    it("原来某个子属性是对象，后来设为多行字符", ()=> {
        let form2yaml = new Form2Yaml('a:\n  b: 1', {
            mergeJsonOfYaml: false
        })
        form2yaml.setJson({
            a: '1\n2'
        })

        let yaml = [
            'a: |-',
            '  1',
            '  2'
        ].join('\n');
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })
    it("原来某个子属性是对象，后来设为多行字符", ()=> {
        let form2yaml = new Form2Yaml('a:\n  b: 1', {
            mergeJsonOfYaml: true,
            nonMergeableKeys: ['a']
        })
        form2yaml.setJson({
            a: {}
        })

        let yaml = [
            'a: {}'
        ].join('\n');
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })

    it("2层数组", ()=> {
        let form2yaml = new Form2Yaml('a:\n  -\n    - 1', {
        })
        form2yaml.setJson({
            a: [[2]]
        })

        let yaml = [
            'a:',
            '  -',
            '    - 2'
        ].join('\n');
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })

    it("数组中包含对象，保留注释", ()=> {
        let form2yaml = new Form2Yaml('a:\n  - b: 1 #注释1\n    c: 2 #注释2', {
        })
        form2yaml.setJson({
            a: [
                {
                    b: 2,
                    c: 3
                }
            ]
        })

        let yaml = [
            'a:',
            '  - b: 2 #注释1',
            '    c: 3 #注释2'
        ].join('\n');
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })

    it("数组中原来值是普通值，现在为对象", ()=> {
        let form2yaml = new Form2Yaml('a:\n  - 1', {
        })
        form2yaml.setJson({
            a: [
                {
                    b: 2,
                    c: 3
                }
            ]
        })

        let yaml = [
            'a:',
            '  - b: 2',
            '    c: 3'
        ].join('\n');
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })

    it("数组中注释顺序和index保持一致", ()=> {
        let form2yaml = new Form2Yaml('a:\n  - 1 #注释1', {
        })
        form2yaml.setJson({
            a: [
                3,
                4
            ]
        })

        let yaml = [
            'a:',
            '  - 3 #注释1',
            '  - 4'
        ].join('\n');
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })
    it("数组中注释顺序和index保持一致", ()=> {
        let form2yaml = new Form2Yaml('a:\n  - 1 #注释1\n  - 2 #注释2', {
        })
        form2yaml.setJson({
            a: [
                3,
                4,
                5
            ]
        })

        let yaml = [
            'a:',
            '  - 3 #注释1',
            '  - 4 #注释2',
            '  - 5'
        ].join('\n');
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })

    it("行内数组", ()=> {
        let form2yaml = new Form2Yaml('a: [1, 2, 3] #test\nb: 2', {
        })
        form2yaml.setJson({
            a: [
                3,
                4,
                5
            ]
        })

        let yaml = [
            'a: [3, 4, 5] #test',
            'b: 2'
        ].join('\n');
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })


    it("行内对象", ()=> {
        let form2yaml = new Form2Yaml('a: {b: 1, c: 2}', {
        })
        form2yaml.setJson({
            a: {
                b: 3,
                c: 4
            }
        })

        let yaml = [
            'a: {b: 3, c: 4}',
        ].join('\n');
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })

    it("多个对象属性更改注释不变", ()=> {
        let form2yaml = new Form2Yaml('a:\n  b: 1 #注释1\n  c: 1 #注释2', {
        })
        form2yaml.setJson({
            a: {
                b: 2,
                c: 3
            }
        })

        let yaml = [
            'a:',
            '  b: 2 #注释1',
            '  c: 3 #注释2'
        ].join('\n');
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })

    it("数组中某个元素有注释，修改后保留", ()=> {
        let form2yaml = new Form2Yaml('a:\n  - b:\n    - 1 #test1\n    - 2 #test2', {
        })
        form2yaml.setJson({
            a: [
                {
                    b: [3,4,5]
                }
            ]
        })

        let yaml = [
            'a:',
            '  - b:',
            '    - 3 #test1',
            '    - 4 #test2',
            '    - 5',
        ].join('\n');
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })

    it("行内数组数量变量", ()=> {
        let form2yaml = new Form2Yaml('a: [1, 2, 3]\nb: 2', {
        })
        form2yaml.setJson({
            a: [3, 4, 5, 6]
        })

        let yaml = [
            'a: [3, 4, 5, 6]',
            'b: 2'
        ].join('\n');
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })

    it("行内数组增加一个对象", ()=> {
        let form2yaml = new Form2Yaml('a: [1, 2, 3]\nb: 2', {
        })
        form2yaml.setJson({
            a: [3, 4, 5, 6, {c: 1}]
        })

        let yaml = [
            'a: [3, 4, 5, 6, {c: 1}]',
            'b: 2'
        ].join('\n');
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })


    it("行内对象包含数组", ()=> {
        let form2yaml = new Form2Yaml('a: {b: 1, c: [1, 2]}', {
        })
        form2yaml.setJson({
            a: {
                b: 3,
                c: [4, 5, 6],
                d: {a: 1}
            }
        })

        let yaml = [
            'a: {b: 3, c: [4, 5, 6], d: {a: 1}}',
        ].join('\n');
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })

    it("行内对象后面接非行内对象", ()=> {
        let form2yaml = new Form2Yaml('a:\n  - 1 #test1\nb: 2', {
        })
        form2yaml.setJson({
            a: [1,2]
        })

        let yaml = [
            'a:',
            '  - 1 #test1',
            '  - 2',
            'b: 2'
        ].join('\n');
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })
    it("对象追加属性，保留注释位置", ()=> {
        let form2yaml = new Form2Yaml('a: 1 #test', {
        })
        form2yaml.setJson({
            a: 1,
            b: 2
        })

        let yaml = [
            'a: 1 #test',
            'b: 2'
        ].join('\n');
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })
    it("对象追加属性，保留注释位置", ()=> {
        let form2yaml = new Form2Yaml('a: 1 #test\n#test2\n #test3', {
        })
        form2yaml.setJson({
            a: 1,
            b: 2
        })

        let yaml = [
            'a: 1 #test',
            '#test2',
            ' #test3',
            'b: 2'
        ].join('\n');
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })

    it("对象数组后追加对象数组，保留注释", ()=> {
        let form2yaml = new Form2Yaml('a:\n  b:\n    - 1 \n#test1\nf: 1', {
        })
        form2yaml.setJson({
            a: {
                b: [2],
                c: ['a']
            }
        })

        let yaml = [
            'a:',
            '  b:',
            '    - 2',
            '#test1',
            '  c:',
            '    - a',
            'f: 1'
        ].join('\n');
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })

    it("对象数组后追加对象数组，保留注释", ()=> {
        let form2yaml = new Form2Yaml('a:\n  b:\n    - 1 #test1\nf: 1', {
        })
        form2yaml.setJson({
            a: {
                b: [2],
                c: ['a']
            }
        })

        let yaml = [
            'a:',
            '  b:',
            '    - 2 #test1',
            '  c:',
            '    - a',
            'f: 1'
        ].join('\n');
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })
    it("对象数组后追加对象数组，保留注释", ()=> {
        let form2yaml = new Form2Yaml('a:\n  b: 1\nf: 2', {
        })
        form2yaml.setJson({
            a: {
                b: 2,
                c: [1, 2]
            },
            f: 3
        })

        let yaml = [
            'a:',
            '  b: 2',
            '  c:',
            '    - 1',
            '    - 2',
            'f: 3'
        ].join('\n');
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })

    it("修改多行字符串的值", ()=> {
        let form2yaml = new Form2Yaml('a:\n  - |-\n    s\n    s\nb: 1', {
        })
        form2yaml.setJson({
            a: ['d\n\n\nd']
        })

        let yaml = [
            'a:',
            '  - |-',
            '    d',
            '',
            '',
            '    d',
            'b: 1'
        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })
    it("数组内容注释单独占一行", ()=> {
        let form2yaml = new Form2Yaml('a:\n  - 1\n#test\nb: 1', {
        })
        form2yaml.setJson({
            a: [1,2]
        })

        let yaml = [
            'a:',
            '  - 1',
            '#test',
            '  - 2',
            'b: 1'
        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })
    it("原来是对象后来改为空数组", ()=> {
        let form2yaml = new Form2Yaml('a:\n  c:\n    - 1\n#test\nb: 1', {
        })
        form2yaml.setJson({
            a: []
        })

        let yaml = [
            'a: []',
            'b: 1'
        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })
    it("原来是对象后来改为空数组", ()=> {
        let form2yaml = new Form2Yaml('a:\n  b:\n    - c:\n      - d #test\n  f: 1', {
        })
        form2yaml.setJson({
            a: {
                b: [
                    {
                        c:[]
                    }
                ]
            }
        })

        let yaml = [
            'a:',
            '  b:',
            '    - c: []',
            '  f: 1'
        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })

    it("原来是对象后来改为空对象", ()=> {
        let form2yaml = new Form2Yaml('a:\n  b:\n    c:\n      d: 1 #test\n  f: 1', {
            mergeJsonOfYaml: false
        })
        form2yaml.setJson({
            a: {
                b: {
                    c:{}
                },
                f: 2
            }
        })

        let yaml = [
            'a:',
            '  b:',
            '    c: {}',
            '  f: 2'
        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })

    it("删除对象某个属性之后，该属性行的注释也删掉", ()=> {
        let form2yaml = new Form2Yaml('a: 1\nb: 2 #test\nc: 3', {
            mergeJsonOfYaml: false
        })
        form2yaml.setJson({
            a: 1,
            c: 2
        })

        let yaml = [
            'a: 1',
            'c: 2',
        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })

    it("老值是普通值，新值为空数组或空对象", ()=> {
        let form2yaml = new Form2Yaml('a: 1\nb: 1', {
            mergeJsonOfYaml: false
        })
        form2yaml.setJson({
            a: [],
            b: {}
        })

        let yaml = [
            'a: []',
            'b: {}'
        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })

    it("yaml为空", ()=> {
        let form2yaml = new Form2Yaml('')
        form2yaml.setJson({
            a: [],
            b: {}
        })

        let yaml = [
            'a: []',
            'b: {}'
        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })


    it("子属性后面有注释，子属性后面添加兄弟元素", ()=> {
        let form2yaml = new Form2Yaml('a:\n  b: 1\n#test\nc: 2')
        form2yaml.setJson({
            a: {
                b:1,
                f:2
            },
        })


        let yaml = [
            'a:',
            '  b: 1',
            '#test',
            '  f: 2',
            'c: 2'
        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })
    it("子属性后面有注释，子属性后面添加兄弟元素", ()=> {
        let defaultYaml = [
            'template:',
            '  spec:',
            '    volumes:',
            '    # 集群已存在的configMap和secret"'
        ].join('\n');
        let form2yaml = new Form2Yaml(defaultYaml, {
            nonMergeableKeys: ['spec.containers', 'spec.initContainers']
        })
        form2yaml.setJson({
            template: {
                "spec": {
                    b: 1
                },
            },
            "strategy": {
                "type": "RollingUpdate",
                "rollingUpdate": {}
            }
        })

        let expectYaml = [
            'template:',
            '  spec:',
            '    volumes:',
            '    # 集群已存在的configMap和secret"',
            '    b: 1',
            'strategy:',
            '  type: RollingUpdate',
            '  rollingUpdate: {}'
        ].join('\n')

        expect(form2yaml.getYaml().trim()).toEqual(expectYaml)
    })
    it("子属性结尾处增加空对象，其中数组数量发生变化", ()=> {
        let defaultYaml = [
            'template:',
            '  metadata:',
            '    labels:',
            '      a:',
            '      - 1',
            '  spec:',
            '    restartPolicy: Always'
        ].join('\n');
        let form2yaml = new Form2Yaml(defaultYaml, {
        })
        form2yaml.setJson({
            template: {
                "metadata": {
                    labels:{
                        a: [1,2]
                    },
                    annotations: {}
                },
                spec:{
                    restartPolicy: 'Always'
                }
            },

        })


        let expectYaml = [
            'template:',
            '  metadata:',
            '    labels:',
            '      a:',
            '      - 1',
            '      - 2',
            '    annotations: {}',
            '  spec:',
            '    restartPolicy: Always'
        ].join('\n')

        expect(form2yaml.getYaml().trim()).toEqual(expectYaml)
    })

    it("子属性结尾处增加空对象，其中数组数量发生变化", ()=> {
        let defaultYaml = [
            'spec:',
            '  args:',
            '    - |',
            '      a',
            '      a',
            '      a',
            '  env: 1'
        ].join('\n');
        let form2yaml = new Form2Yaml(defaultYaml, {
            mergeJsonOfYaml: false
        })
        form2yaml.setJson({
            spec: {
                env: 1
            }
        })


        let expectYaml = [
            'spec:',
            // '  args: []',
            '  env: 1'
        ].join('\n')

        expect(form2yaml.getYaml().trim()).toEqual(expectYaml)
    })
    it("子属性结尾处增加空对象，其中数组数量发生变化", ()=> {
        let defaultYaml = [
            'spec:',
            '  args:',
            '    - |',
            '      a',
            '      a',
            '      a',
            '  env: 1'
        ].join('\n');
        let form2yaml = new Form2Yaml(defaultYaml, {
            mergeJsonOfYaml: false
        })
        form2yaml.setJson({
            spec: {
                args: [],
                env: 1
            }
        })


        let expectYaml = [
            'spec:',
            '  args: []',
            '  env: 1'
        ].join('\n')

        expect(form2yaml.getYaml().trim()).toEqual(expectYaml)
    })

    it(">-长字符串", ()=> {
        let defaultYaml = [
            'a:',
            '  b: >-',
            '    ddd',
            'c: 1'
        ].join('\n');
        let form2yaml = new Form2Yaml(defaultYaml, {
            mergeJsonOfYaml: false
        })
        form2yaml.setJson({
            a: {
                b: 'sss',
            },
            c: 1
        })


        let expectYaml = [
            'a:',
            '  b: sss',
            'c: 1'
        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(expectYaml)
    })
    it("删除数组中一个值", ()=> {
        let defaultYaml = [
            'a:',
            '  - b: 1',
            '  - c: 1',
            'd: 1'
        ].join('\n');
        let form2yaml = new Form2Yaml(defaultYaml, {
            mergeJsonOfYaml: false
        })
        form2yaml.setJson({
            a: [
                {
                    b: 1
                }
            ],
            d: 1
        })


        let expectYaml = [
            'a:',
            '  - b: 1',
            'd: 1'
        ].join('\n')

        expect(form2yaml.getYaml().trim()).toEqual(expectYaml)
    })
    it("删除行内数组中一个值", ()=> {
        let defaultYaml = [
            'a: [{b: 1}, {c: 1}]',
            'd: 1'
        ].join('\n');
        let form2yaml = new Form2Yaml(defaultYaml, {
            mergeJsonOfYaml: false
        })
        form2yaml.setJson({
            a: [
                {
                    b: 1
                }
            ],
            d: 1
        })


        let expectYaml = [
            'a: [{b: 1}]',
            'd: 1'
        ].join('\n')

        expect(form2yaml.getYaml().trim()).toEqual(expectYaml)
    })
    it("删除行内对象中一个值", ()=> {
        let defaultYaml = [
            'a: {b: 1, c: 2} #test',
            'd: 1'
        ].join('\n');
        let form2yaml = new Form2Yaml(defaultYaml, {
            mergeJsonOfYaml: false
        })
        form2yaml.setJson({
            a: {
                b: 1
            },
            d: 1
        })


        let expectYaml = [
            'a: {b: 1} #test',
            'd: 1'
        ].join('\n')

        expect(form2yaml.getYaml().trim()).toEqual(expectYaml)
    })
    it("删除数组中一个值", ()=> {
        let defaultYaml = [
            'a:',
            '  a1:',
            '    - b: 1',
            '    - c: 1',
            '  d: 1'
        ].join('\n');
        let form2yaml = new Form2Yaml(defaultYaml, {
            mergeJsonOfYaml: false
        })
        form2yaml.setJson({
            a:  {
                a1: [
                    {
                        b: 1
                    }
                ],
                d: 1
            }
        })


        let expectYaml = [
            'a:',
            '  a1:',
            '    - b: 1',
            '  d: 1'
        ].join('\n')

        expect(form2yaml.getYaml().trim()).toEqual(expectYaml)
    })
    it("删除数组中全部值", ()=> {
        let defaultYaml = [
            'a:',
            '  a1:',
            '    - name: 1',
            '      env:',
            '        - b: 1',
            '        - c: 1',
            '  d: 1'
        ].join('\n');
        let form2yaml = new Form2Yaml(defaultYaml, {
            mergeJsonOfYaml: false
        })
        form2yaml.setJson({
            a:  {
                a1: [
                    {
                        name: 1
                    }
                ],
                d: 1
            }
        })


        let expectYaml = [
            'a:',
            '  a1:',
            '    - name: 1',
            '  d: 1'
        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(expectYaml)
    })

    it("->格式替换新值", ()=> {
        let defaultYaml = [
            'spec:',
            '  template:',
            '    spec:',
            '      containers:',
            '        - name: ',
            '          command:',
            '            - >-',
            '              ssssss',
            '    metadata: 1'
        ].join('\n');

        let form2yaml = new Form2Yaml(defaultYaml, {
            mergeJsonOfYaml: false
        })
        form2yaml.setJson({
            spec: {
                template:{
                    spec:{
                        containers: [
                            {
                                name: '',
                                command: [
                                    'aaa'
                                ]
                            }
                        ]
                    },
                    metadata: 1
                }
            }
        })


        let expectYaml = [
            'spec:',
            '  template:',
            '    spec:',
            '      containers:',
            '        - name:',
            '          command:',
            '            - aaa',
            '    metadata: 1'
        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(expectYaml)
    })
})
