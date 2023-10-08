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
})