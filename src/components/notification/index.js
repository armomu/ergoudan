import Taro, { Component } from '@tarojs/taro';
import { View, Image } from '@tarojs/components';
import './index.scss';
import closeIcon from '../../assets/icon/icon_cancel_g@2x.png';

/**
 * 消息通知弹框
 * @param  {string} content 提示文字
 * @param  {Function} onBtnClick 点击按钮事件
 */
export default class Notification extends Component {
    render() {
        let { msg, visible, onClose, msgOnClick } = this.props;
        return (
            <View>
                {
                    <View
                        className={
                            visible
                                ?
                                'ui-notification biubiubiu'
                                :
                                'ui-notification'
                        }
                    >
                        {
                            msg
                                ?
                                <View className='msg' onClick={msgOnClick}>{msg}</View>
                                :
                                null
                        }
                        {
                            this.props.children
                        }
                        <Image
                            className='close-btn'
                            src={closeIcon}
                            onClick={onClose}
                        />
                    </View>
                }
            </View>

        );
    }
}


