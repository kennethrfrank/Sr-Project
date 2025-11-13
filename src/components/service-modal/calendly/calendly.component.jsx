import useScript from '../../../hooks/useScript';
import './calendly.styles.css'


const Calendly = ()=>{
    useScript('https://assets.calendly.com/assets/external/widget.js');
    return <div class="calendly-inline-widget" data-url="https://calendly.com/nclyne?background_color=000000&text_color=f8e6be&primary_color=e2b74f" style={{minWidth: "320px", height: "640px", overflowY: "hidden"}}></div>
}



export default Calendly;