export interface RegionCity { name: string; districts: string[] }
export interface RegionProvince { name: string; cities: RegionCity[] }

export const regions: RegionProvince[] = [
  { name: '湖北省', cities: [{ name: '武汉市', districts: ['江岸区', '江汉区', '硚口区', '汉阳区', '武昌区', '洪山区'] }, { name: '宜昌市', districts: ['西陵区', '伍家岗区', '点军区', '猇亭区', '夷陵区'] }, { name: '襄阳市', districts: ['襄城区', '樊城区', '襄州区'] }] },
  { name: '浙江省', cities: [{ name: '杭州市', districts: ['上城区', '拱墅区', '西湖区', '滨江区', '萧山区', '余杭区'] }, { name: '宁波市', districts: ['海曙区', '江北区', '北仑区', '鄞州区', '镇海区'] }, { name: '温州市', districts: ['鹿城区', '龙湾区', '瓯海区', '洞头区'] }] },
  { name: '北京市', cities: [{ name: '北京市', districts: ['东城区', '西城区', '朝阳区', '海淀区', '丰台区', '通州区'] }] },
  { name: '上海市', cities: [{ name: '上海市', districts: ['黄浦区', '徐汇区', '长宁区', '静安区', '浦东新区', '闵行区'] }] },
  { name: '广东省', cities: [{ name: '广州市', districts: ['越秀区', '海珠区', '荔湾区', '天河区', '白云区', '番禺区'] }, { name: '深圳市', districts: ['罗湖区', '福田区', '南山区', '宝安区', '龙岗区', '龙华区'] }, { name: '珠海市', districts: ['香洲区', '斗门区', '金湾区'] }] },
  { name: '江苏省', cities: [{ name: '南京市', districts: ['玄武区', '秦淮区', '建邺区', '鼓楼区', '栖霞区', '雨花台区'] }, { name: '苏州市', districts: ['姑苏区', '虎丘区', '吴中区', '相城区', '吴江区'] }] },
  { name: '四川省', cities: [{ name: '成都市', districts: ['锦江区', '青羊区', '金牛区', '武侯区', '成华区', '双流区'] }] },
  { name: '湖南省', cities: [{ name: '长沙市', districts: ['芙蓉区', '天心区', '岳麓区', '开福区', '雨花区', '望城区'] }] },
  { name: '福建省', cities: [{ name: '福州市', districts: ['鼓楼区', '台江区', '仓山区', '晋安区', '马尾区'] }, { name: '厦门市', districts: ['思明区', '海沧区', '湖里区', '集美区', '同安区'] }] },
  { name: '山东省', cities: [{ name: '济南市', districts: ['历下区', '市中区', '槐荫区', '天桥区', '历城区'] }, { name: '青岛市', districts: ['市南区', '市北区', '黄岛区', '崂山区', '李沧区'] }] },
]
