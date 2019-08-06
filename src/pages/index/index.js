import Taro, { Component } from '@tarojs/taro';
import { View, Map, CoverImage } from '@tarojs/components';
import { observer, inject } from '@tarojs/mobx';

import './index.scss';

import siteIcon from '../../assets/icon/icon_site@2x.png';
import siteMine from '../../assets/icon/icon_currentpos@2x.png';

@inject('counterStore')
@observer
class Index extends Component {
    constructor() {
        super();
        this.state = {
            latitude: 22.71991,
            longitude: 114.24779,
            data: [],
        };
    }

    mapCtx = null
    componentDidMount() {
        this.handleGetUserLocation();
        this.mapCtx = Taro.createMapContext('myMap', this);
    }
    componentDidShow() {

    }
    componentDidHide() {

    }
    initData = () => {

    }

    // 获取用户坐标位置
    handleGetUserLocation = () => {
        Taro.getLocation({ type: 'gcj02' })
            .then((res) => {
                this.setState({
                    latitude: res.latitude,
                    longitude: res.longitude
                }, () => {
                    this.initData();
                });
            })
            .catch(() => {
                Taro.showToast({
                    title: '你已经取消授权获取位置权限，请点击左下角位置按钮重新获取位置授权',
                    icon: 'none',
                    duration: 5000
                });
            });
    }

    // 地图点位点击事件
    handleMarkerClick = (e) => {

    }

    // 地图点击事件
    handleClickMap = () => {

    }



    // 地图视图改变获取地图中心点位置
    handleRegionChange = (e) => {
        if (e.type === 'end' && (e.causedBy === 'scale' || e.causedBy === 'drag')) {
            this.mapCtx.getCenterLocation({
                success: (res) => {
                    this.setState({
                        latitude: res.latitude,
                        longitude: res.longitude,
                    });

                }
            });
        }
    }


    render() {
        const { latitude, longitude, data} = this.state;
        const markers = data.map((item, index) => {
            const obj = {
                iconPath: siteIcon,
                id: item.id,
                latitude: item.latitude,
                longitude: item.longitude,
                width: '75rpx',
                height: '75rpx',
            };
            if (index === 0) {
                obj.callout = {
                    content: '离我最近',
                    color: '#ffffff',
                    bgColor: '#0A1219',
                    padding: 8,
                    borderRadius: '27rpx',
                    display: 'ALWAYS'
                };
            }
            return obj;
        });


        return (
            <View className='index'>
                <View className='dj' onClick={this.handleClickMap}>dj</View>
                <View className='dj' onClick={this.handleMarkerClick}>dj</View>
                <View className='dj' onClick={this.handleRegionChange}>dj</View>
                <Map
                    className='map'
                    id='myMap'
                    scale='14'
                    layer-style={1}
                    subkey='IDEBZ-6YEKF-BBXJN-JAAVC-TGOI5-4HFIA'
                    showLocation
                    latitude={latitude}
                    longitude={longitude}
                    bindtap={this.handleClickMap}
                    bindmarkertap={this.handleMarkerClick}
                    bindregionchange={this.handleRegionChange}
                    markers={markers}
                >
                    <CoverImage
                        className='map-center-icon'
                        src={siteMine}
                    />
                </Map>
            </View >
        );
    }
}

export default Index;
