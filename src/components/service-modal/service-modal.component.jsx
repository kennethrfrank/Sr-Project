import {Modal, Button, Icon} from 'semantic-ui-react'
import React from 'react';
import './service-modal.styles.css'
import Calendly from './calendly/calendly.component';

const returnModalType = (modalType)=>{
    if(modalType == 'calendar'){
        return <Calendly/>
    }else{
        return <iframe className='contactUs' src="https://us18.list-manage.com/contact-form?u=9cd7b0622c5f0aeecf9b72cb3&form_id=3973ba7d27bde7a94daa62bad3ea97e3"></iframe>
    }
}
const ServiceModal = ({open, setOpen, type, name})=>{
    console.log(type + " sm");
    return(
    <Modal
        basic
        onClose={()=> setOpen(false)}
        onOpen={()=> setOpen(true)}
        open = {open}
        trigger={<Button className='blackHomeButton' fluid> {name} </Button>}>
          <Modal.Content>
            {returnModalType(type)}
          </Modal.Content>
      </Modal>
    )
}

export default ServiceModal;