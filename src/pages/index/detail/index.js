import Taro, { Component } from '@tarojs/taro';
import { View, Image, Swiper, SwiperItem, Text } from '@tarojs/components';
import Disconnect from '../../../components/disconnect';
import Authorize from '../../../utils/authorize';

import './index.scss';

import icon_coll_d from '../../../assets/icon/coll_d_g@3x.png';
import icon_coll_sl from '../../../assets/icon/coll_c_y@3x.png';
import icon_g2 from '../../../assets/icon/icon_gps_s@3x.png';
import icon_n from '../../../assets/icon/icon_notes@3x.png';
import dz from '../../../assets/icon/dz.png';
import icon_chargingPiles from '../../../assets/icon/icon_chargingPiles@3x.png';


import { getChargingStationDetail, getChargingStationChargers } from '../../../api/chargingStation';
import { collectCreate, collectDelete } from '../../../api/collect';

import { spileStatusDict, spileTypeDict } from '../../../model/dict';

export default class SpileDetail extends Component {

    config = {
        navigationBarTitleText: '电站详情',
        enablePullDownRefresh: true,
    }

    constructor() {
        super(...arguments);
        this.state = {
            currentView: 0, // 当前视图索引
            data: {
                id: ''
            },
            chargers: {
                chargers_count: ''
            },
            isData: true
        };
    }

    componentDidMount() {
        Taro.startPullDownRefresh();
    }
    onPullDownRefresh() {
        setTimeout(() => {
            this.initData();
        }, 300);
    }
    initData = () => {
        // 获取电站详情
        const { id, distance, chargeStationBill } = this.$router.params;
        getChargingStationDetail(id || 1)
            .then((res) => {
                res.data.distance = distance;
                res.data.charge_station_bill = chargeStationBill;
                this.setState({
                    isData: true,
                    data: res.data
                });
                Taro.setNavigationBarTitle({ title: res.data.name });

            })
            .catch(() => {
                this.setState({
                    isData: false
                });
            });
        // 获取电站详情成功后获取电站电桩列表
        getChargingStationChargers(id || 1)
            .then((obj) => {
                Taro.stopPullDownRefresh();
                this.setState({
                    chargers: { ...obj.data }
                });
            });

    }
    handleTabChange(val) {
        this.setState({
            currentView: val
        });
    }
    handleCurrentViewChange = (e) => {
        const current = e.detail.current;
        this.setState({
            currentView: current
        });
    }

    // 处理用户收藏
    handleSCollectlick = () => {
        const { data } = this.state;
        const mlmlh = Authorize.checkSignin(false);
        if (!mlmlh) {
            Taro.showToast({
                title: '没有登录！',
                icon: 'none'
            });
            return false;
        }
        if (data.id !== '' && data.is_favorited === 1) {
            collectDelete(data.id)
                .then(() => {
                    data.is_favorited = 0;
                    this.setState({
                        data: data
                    });
                    Taro.showToast({
                        title: '已取消收藏！',
                        icon: 'none'
                    });
                });
        } else {
            collectCreate(data.id)
                .then(() => {
                    data.is_favorited = 1;
                    this.setState({
                        data: data
                    });
                    Taro.showToast({
                        title: '收藏成功！',
                        icon: 'success'
                    });
                });

        }

    }

    handleGetChargingStationChargers(id, currentView) {
        if (this.state.chargers.chargers_count === '') {
            if (id !== '' && currentView !== 0) {
                getChargingStationChargers(id)
                    .then((res) => {
                        this.setState({
                            chargers: { ...res.data }
                        });
                    });
            }
        }
    }

    handleNavigateTo = (serialNumber, name) => {
        Taro.navigateTo({
            url: `/pages/scan-code/settings/index?serialNumber=${serialNumber}&openType=2`
        });
    }

    handleOpenLocation = (latitude, longitude, name, e) => {
        e.stopPropagation();
        Taro.openLocation({
            latitude: latitude,
            longitude: longitude,
            name
        });
    }
    onReset = () => {
        // 获取电站详情
        const { id, distance } = this.$router.params;
        getChargingStationDetail(id)
            .then((res) => {
                res.data.distance = distance;
                this.setState({
                    isData: true,
                    data: res.data
                });

            })
            .catch(() => {
                this.setState({
                    isData: false
                });
            });
        // 获取电站详情成功后获取电站电桩列表
        getChargingStationChargers(id)
            .then((obj) => {
                this.setState({
                    chargers: { ...obj.data }
                });
            });
    }
    handleCallPhone = (phone) => {
        Taro.makePhoneCall({
            phoneNumber: phone
        });
    }
    render() {
        const { currentView, data, chargers, isData } = this.state;
        const { result } = chargers;
        const statusDict = spileStatusDict;
        const listNode = result.map((item, index) => {
            return (
                <View className='item' onClick={this.handleNavigateTo.bind(this, item.serial_number, item.name)} key={index}>
                    <View className='spile-icon'>
                        <Image src={icon_chargingPiles} />
                    </View>
                    <View className='desc'>
                        <View className='name'>{item.name}</View>
                        <View className='km'>{item.plug_type_name}{spileTypeDict[item.plug_type_id]}/{item.rated_power}kw</View>
                        <View className='km'>编号：{item.serial_number}</View>
                    </View>
                    <View
                        className={
                            'd-status ' + statusDict[item.status].className
                        }

                    >
                        {
                            statusDict[item.status].icon === ''
                                ?
                                null
                                :
                                <Image src={statusDict[item.status].icon} />
                        }
                        <View className='text'>
                            {
                                item.status === 99
                                    ?
                                    '离线'
                                    :
                                    spileStatusDict[item.status].title
                            }
                        </View>
                    </View>
                </View>
            );
        });
        return (
            <View className='spile-detail'>
                {
                    data.id !== ''
                        ?
                        <View>
                            <View className='tabs'>
                                <View
                                    className={
                                        currentView === 0
                                            ?
                                            'title active'
                                            :
                                            'title'
                                    }
                                    onClick={this.handleTabChange.bind(this, 0)}
                                >电站详情</View>
                                <View
                                    className={
                                        currentView === 1
                                            ?
                                            'title active'
                                            :
                                            'title'
                                    }
                                    onClick={this.handleTabChange.bind(this, 1)}
                                >电桩状态</View>
                            </View>
                            <Swiper
                                className='swiper-view'
                                duration={300}
                                current={currentView}
                                onChange={this.handleCurrentViewChange}
                            >
                                <SwiperItem>
                                    <View className='panel'>
                                        <View className='panel-container'>
                                            <View className='image'><Image src={data.pic_url || dz} /></View>
                                            <View className='right-content'>
                                                <View className='title'>
                                                    <View className='text'>
                                                        <View>{data.name}</View>
                                                    </View>
                                                    <Image
                                                        src={
                                                            data.is_favorited === 1
                                                                ?
                                                                icon_coll_sl
                                                                :
                                                                icon_coll_d
                                                        }
                                                        className='sc'
                                                        onClick={this.handleSCollectlick.bind(this, data.id)}
                                                    />
                                                </View>
                                                <View className='addr'>{data.address}</View>
                                                <View className='qt'>
                                                    <View className='text'>{data.distance}</View>
                                                    <Image className='icon-map' src={icon_g2} onClick={this.handleOpenLocation.bind(this, data.latitude, data.longitude, data.name)} />
                                                </View>
                                            </View>

                                        </View>
                                        <View className='ph-status'>
                                            <View className='tag tag4'><Text>总桩</Text>{chargers.chargers_count}</View>
                                            <View className='tag tag1'><Text>快</Text>{chargers.charger_type1_count}</View>
                                            <View className='tag tag2'><Text>超</Text>{chargers.charger_type2_count}</View>
                                            <View className='tag tag3'><Text>慢</Text>{chargers.charger_type3_count}</View>
                                        </View>
                                    </View>
                                    <View className='text-list'>
                                        <View className='item'>
                                            <View className='name'>充电费率</View>
                                            <View className='desc'>{data.charge_station_bill || '0.85-1.25'}元/度（含服务费）</View>
                                            {/* <Image src={icon_more} className='more' /> */}
                                        </View>
                                        <View className='item'>
                                            <View className='name'>停车费用</View>
                                            <View className='desc'>{data.parking_description}</View>
                                        </View>
                                        <View className='item'>
                                            <View className='name'>开放时间</View>
                                            <View className='desc'>{data.public_time}</View>
                                        </View>
                                        <View className='item'>
                                            <View className='name'>服务电话</View>
                                            <View className='desc' onClick={this.handleCallPhone.bind(this, data.phone)}>{data.phone}</View>
                                        </View>
                                        <View className='item'>
                                            <View className='name'>运营商</View>
                                            <View className='desc'>{data.service_provider_name}</View>
                                        </View>
                                    </View>
                                    <View className='tip-box'>
                                        <View className='name'>
                                            <Image src={icon_n} className='note' /><Text>备注</Text>
                                        </View>
                                        <View className='desc'>{data.remark}</View>
                                    </View>
                                </SwiperItem>
                                <SwiperItem>
                                    <View className='status-panel'>
                                        <View className='ph-status'>
                                            <View className='tag tag4'><Text>总桩</Text>{chargers.chargers_available_count}/{chargers.chargers_count}</View>
                                            <View className='tag tag1'><Text>快</Text>{chargers.charger_type1_available_count}/{chargers.charger_type1_count}</View>
                                            <View className='tag tag2'><Text>超</Text>{chargers.charger_type2_available_count}/{chargers.charger_type2_count}</View>
                                            <View className='tag tag3'><Text>慢</Text>{chargers.charger_type3_avaialble_count}/{chargers.charger_type3_count}</View>
                                        </View>
                                        <View className='list'>
                                            {listNode}
                                        </View>
                                    </View>
                                </SwiperItem>
                            </Swiper>
                        </View>
                        :
                        null
                }
                {
                    isData ? null : <Disconnect onReset={this.onReset} />
                }
            </View>
        );
    }
}

