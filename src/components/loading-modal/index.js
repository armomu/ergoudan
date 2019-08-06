import Taro, { Component } from '@tarojs/taro';
import { View } from '@tarojs/components';
import './index.scss';

export default class modalLoading extends Component {
    render() {
        const { content } = this.props;
        return (
            <View className='ui-modal'>
                <View className='mask'></View>
                <View className='warp'>
                    <View className='container'>
                        {/* <View className='loader'>
                            <View className='loader-inner pacman'>
                                <View className='child1'></View>
                                <View className='child2'></View>
                                <View className='child3'></View>
                                <View className='child4'></View>
                                <View className='child5'></View>
                            </View>
                        </View>
                        <View className='canvas canvas2'>
                            <View className='spinner2'></View>
                            <View className='hourHand'></View>
                        </View> */}
                        <View className='la-ball-climbing-dot'>
                            <View></View>
                            <View></View>
                            <View></View>
                            <View></View>
                        </View>

                        <View className='content'>{content}</View>
                    </View>
                </View>
            </View>
        );
    }
}


