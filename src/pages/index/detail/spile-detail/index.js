import Taro, { Component } from '@tarojs/taro';
import { observer, inject } from '@tarojs/mobx';
import { View, Image, Navigator, Button } from '@tarojs/components';
import Disconnect from '../../../../components/disconnect';
import { getChargerDetail } from '../../../../api/chargingStation';
import Authorize from '../../../../utils/authorize';
import './index.scss';

import icon_more from '../../../../assets/icon/icon_more_g_s@3x.png';
import { spileStatusDict, spileTypeDict } from '../../../../model/dict';

@inject('counterStore')
@observer
export default class SpileDetail extends Component {

    config = {
        navigationBarTitleText: '电桩详情'
    }
    state = {
        data: {},
        isData: true,
        responseMsg: ''
    }
    componentDidMount() {
        this.initData();
    }
    onReset = () => {
        this.initData();
    }
    initData() {
        const { serialNumber, name } = this.$router.params;
        getChargerDetail(serialNumber)
            .then((res) => {
                Taro.setNavigationBarTitle({ title: name });
                this.setState({
                    data: res.data
                });
            })
            .catch((err) => {
                this.setState({
                    isData: false,
                    responseMsg: err.message
                });
            });
    }
    handleOnGetUserInfo = (e) => {
        e.stopPropagation();
        Authorize.getUserInfo(e);
    }
    handleToDetail = () => {

    }
    render() {
        const { counterStore: { isLogin, serialNumber_store } } = this.props;
        const { data, isData, responseMsg } = this.state;
        return (
            <View>
                {
                    data.id
                        ?
                        <View className='spile-detail-a'>
                            {
                                isLogin
                                    ?
                                    null
                                    :
                                    <Button
                                        className='login-btn'
                                        openType='getUserInfo'
                                        onGetUserInfo={this.handleOnGetUserInfo}
                                    >
                                        微信登录
                                    </Button>
                            }
                            <View className='item bd1'>
                                <View className='name'>状&#12288;&#12288;态：</View>
                                <View
                                    className={
                                        `desc ${spileStatusDict[data.status].className}`
                                    }
                                >
                                    {
                                        data.status === 99
                                            ?
                                            '离线'
                                            :
                                            spileStatusDict[data.status].title
                                    }
                                </View>
                            </View>
                            <View className='item'>
                                <View className='name'>枪口类型：</View>
                                <View className='desc'>{data.plug_type_name}</View>
                            </View>
                            <View className='item'>
                                <View className='name'>充电类型：</View>
                                <View className='desc'>{spileTypeDict[data.charger_type_id]}</View>
                            </View>
                            <View className='item'>
                                <View className='name'>功&#12288;&#12288;率：</View>
                                <View className='desc'>{data.rated_power}kw</View>
                            </View>
                            <View className='item bd1'>
                                <View className='name'>运营单位：</View>
                                <View className='desc'>{data.service_provider_name}</View>
                            </View>
                            <View className='item bd1'>
                                <View className='name'>当前费率：</View>
                                <View className='desc'>{data.charge_bill}元/度</View>
                                <View className='link'>
                                    <Navigator className='text' url={'/pages/index/rate/index?id=' + data.id} >查看详细费率</Navigator>
                                    <Image src={icon_more} className='more' />
                                </View>
                            </View>

                            <View
                                className={
                                    data.status === 0
                                        ?
                                        'ui-button'
                                        :
                                        'ui-button g'
                                }
                                onClick={this.handleToDetail}
                                url={
                                    serialNumber_store
                                        ?
                                        '/pages/scan-code/charging/index?openType=2'
                                        :
                                        data.status === 0 && data.car_link_status === 2
                                            ?
                                            `/pages/scan-code/settings/index?serialNumber=${data.serial_number}`
                                            :
                                            null
                                }
                            >
                                {
                                    serialNumber_store
                                        ?
                                        '有订单进行中！点击前往'
                                        :
                                        '开始充电'
                                }
                            </View>
                        </View>
                        :
                        isData ? null : <Disconnect tips={responseMsg} onReset={this.onReset} />
                }

            </View>
        );
    }
}

