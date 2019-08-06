import Taro, { Component } from '@tarojs/taro';
import { View, Image } from '@tarojs/components';
import './index.scss';
import no_rocord from '../../assets/icon/no_rocord@2x.png';
/**
 * loading 加载效果
 * @param  {number} pageIndex 第几页
 * @param  {number} pageSize 每页条数
 * @param  {boolean} isLoad 是否加载中
 * @param  {number} total 总条目数
 * @param  {string} noDataText 替换暂无数据文本
 */
export default class Loading extends Component {
    config = {
        navigationBarTitleText: '加载动画'
    }
    render() {
        const { pageIndex, pageSize, isLoad, total, noDataText } = this.props;
        let viewNode;
        if (pageIndex * pageSize >= total) {
            if (pageIndex === 1 && isLoad && total === 0) {
                viewNode = <View className='spinner'>
                    <View className='bounce1'></View>
                    <View className='bounce2'></View>
                    <View className='bounce3'></View>
                </View>;
            } else if (pageIndex === 1 && total === 0 && !isLoad) {
                viewNode = <View className='no-data'>
                    <Image src={no_rocord} />
                    <View className='text'>{noDataText || '暂无数据记录'}</View>
                </View>;
            } else if (pageIndex >= 1 && total > 0 && isLoad) {
                viewNode = <View className='no-more'>我也是有底线的</View>;
            }
        } else {
            if (isLoad) {
                viewNode = <View className='spinner'>
                    <View className='bounce1'></View>
                    <View className='bounce2'></View>
                    <View className='bounce3'></View>
                </View>;
            } else {
                viewNode = null;
            }
        }

        return (
            <View className='page-footer'>{viewNode}</View>
        );
    }
}


