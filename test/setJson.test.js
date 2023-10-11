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
            ignoreMissing: false
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
            '    #注释',
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
            ignoreMissing: false
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
            ignoreMissing: false
        })
        form2yaml.setJson({
            a: '1\n2'
        })

        let yaml = [
            'a: |-',
            '  1',
            '  2'
        ].join('\n')
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })
    it("原来是多行字符，后来设为单行字符", ()=> {
        let form2yaml = new Form2Yaml('a: |-\n  1\n  2', {
            ignoreMissing: false
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
            ignoreMissing: false
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
            ignoreMissing: false
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
            ignoreMissing: true,
            controlledYamlKey: ['a']
        })
        form2yaml.setJson({
            a: {}
        })

        let yaml = [
            'a: {}'
        ].join('\n');
        expect(form2yaml.getYaml().trim()).toEqual(yaml)
    })
})