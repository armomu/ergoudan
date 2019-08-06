import Taro, { Component } from '@tarojs/taro';
import { View, Map, CoverImage } from '@tarojs/components';
import { observer, inject } from '@tarojs/mobx';

import './index.scss';

@inject('counterStore')
@observer
class Index extends Component {
    constructor() {
        super();
        this.state = {
            latitude: 22.71991,
            longitude: 114.24779,
            data: [],
            direction: 0
        };
    }

    mapCtx = null
    componentDidMount() {
        this.handleGetUserLocation();
        Taro.startCompass({
            success: () => {
                Taro.onCompassChange((res) => {
                    this.setState({
                        direction:res.direction
                    });

                });
            }
        });
    }

    // 获取用户坐标位置
    handleGetUserLocation = () => {
        Taro.getLocation({ type: 'gcj02' })
            .then((res) => {
                this.setState({
                    latitude: res.latitude,
                    longitude: res.longitude
                }, () => {
                    // this.initData();
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

    render() {
        const { latitude, longitude, direction } = this.state;
        return (
            <View className='index'>
                <Map
                    className='map'
                    id='myMap'
                    scale='20'
                    layer-style={1}
                    subkey='O7FBZ-WN73K-EZQJ7-AITE5-BETRJ-44B45'
                    showLocation
                    showCompass
                    showScale
                    enable-3D
                    rotate={direction}
                    enableRotate
                    skew={30}
                    enableOverlooking
                    latitude={latitude}
                    longitude={longitude}
                >
                    <CoverImage
                        className='map-center-icon'
                        src='../../assets/icon/icon_currentpos@3x.png'
                    />
                </Map>
            </View >
        );
    }
}

export default Index;
