import Taro, { Component } from '@tarojs/taro';
import { View } from '@tarojs/components';
import './index.scss';

/**
 * 弹框
 * @param  {string} cancelText 取消按钮文字
 * @param  {string} confirmText 确定按钮文字
 * @param  {string} content 提示文字
 * @param  {string} title 弹框标题
 * @param  {Function} onBtnClick 点击按钮事件，确定为真，取消为假
 */
export default class Modal extends Component {
    handleClick = (bool) => {
        this.props.onBtnClick(bool);
    }
    render() {
        let { cancelText, confirmText, content, visible, title, btnVisible } = this.props;
        const btn = typeof btnVisible === 'undefined' ? true : btnVisible;
        // let { stateVisible } = this.state;
        return (
            <View>
                {
                    visible
                        ?
                        <View className='ui-modal'>
                            <View className='mask' onClick={this.handleClick.bind(this, false)}></View>
                            <View className='warp'>
                                <View className='container'>
                                    {
                                        title
                                            ?
                                            <View
                                                className={content ? 'title' : 'title t'}
                                            >{title}</View>
                                            :
                                            null
                                    }
                                    {
                                        content
                                            ?
                                            <View className='content'>{content}</View>
                                            :
                                            null
                                    }
                                    {this.props.children}
                                    {
                                        btn
                                            ?
                                            <View className='btn-group'>
                                                <View className='btn btn-g' onClick={this.handleClick.bind(this, false)}>
                                                    {cancelText || '取消'}
                                                </View>
                                                <View className='btn' onClick={this.handleClick.bind(this, true)}>
                                                    {confirmText || '确定'}
                                                </View>
                                            </View>
                                            :
                                            null
                                    }

                                </View>
                            </View>
                        </View>
                        :
                        null
                }
            </View>

        );
    }
}


