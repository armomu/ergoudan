import Taro, { Component } from '@tarojs/taro';
import { View, Text, Image } from '@tarojs/components';
import './index.scss';
import no_wifi from '../../assets/icon/no_wifi@2x.png';

/**
 * 无网络组件
 * @param  { Function } onReset 点击 resetText 事件
 * @param  { string } tips 提示文字
 * @param  { string } resetText 连接文字
 */
export default class Disconnect extends Component {
    render() {
        const { onReset, tips, resetText } = this.props;
        return (
            <View className='disconnect'>
                <Image src={no_wifi} />
                <View>{tips || '哎呦！没网了'}，<Text onClick={onReset}>{resetText || '点击刷新'}</Text></View>
            </View>
        );
    }
}

