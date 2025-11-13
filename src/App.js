import logo from './logosvg.svg'
import { useEffect, useState } from 'react'
import './App.css';
import React from 'react';
import 'semantic-ui-css/semantic.min.css'
import LogoTagSiteStarter from './components/logo-tag-site-starter/logo-tag-site-starter';
import Home from './components/routes/home/home.component'
import { Route, Routes } from 'react-router-dom';
import Projects from './components/routes/projects/projects.component';
import Gallery from './components/routes/gallery/gallery.component';
import Shop from './components/routes/shop/shop.component';
import Content from './components/content/content.component';
import $ from 'jquery'

const App = ()=>{
    const [searchField, setSearchField] = useState('');
    const [nfts, setNfts] = useState([]);

    const [videos, setVideos] = useState([]);
    const [articles, setArticles] = useState([]);

    const socials = [
      { platform: "game",
      link: "http://nclyne.gallery"},
      { platform: "game",
      link: "https://medium.com/nclyne"},
      { platform: "game",
      link: "https://www.youtube.com/channel/UCwZA4pIiYSJO9yrXOlcUMfQ"},
      { platform: "game",
      link: "https://twitter.com/nclyneart"},
      { platform: "game",
      link: "https://instagram.com/nclyneart"},
      { platform: "game",
      link: "https://www.twitch.tv/nclyneart"},
      { platform: "game",
        link: "https://discord.com/invite/QXrYuwzM24"}
    ];
    
    const [nclyneNfts, setNclyneNfts] = useState(nfts);
    const curatedByNclyne =
      {title: "Curated by Nclyne",
       subCopy: ["An art initiative introducing select talent to blockchain markets.",
     "Each limited series is in collaboration with a rising artist who receives 100% of the primary sales commission."],}
    ;
    const spaceLooters =
      {title: "LILKOOL's SPACE LOOTERS",
      img: 'looterspromo.gif',
       subCopy: ["LIL Aliens. Obsessively collecting loot.", 
     "Web3 access to KOOL art, fashion and experiences.", "MINTING NOW!"],
    link: "https://spacelooters.com"}
    ;

    const [open, setOpen] = useState(false);
    const [open1, setOpen1] = useState(false);

    const[gallery, setGallery] = useState("nclyne");

    const[shopifyActive, setShopifyActive] = useState(false);
    const[shopifyStyle, setShopifyStyle] = useState({display: "none"});

    useEffect(()=>{
      if(shopifyActive){
        console.log('UE: shopify is active');
        $(".shopify-buy-frame > iframe").slideDown();
      }else{
        console.log("UE: shopify is inactive");
        $(".shopify-buy-frame > iframe").slideUp();
      }
    }, [shopifyActive]);


    useEffect(()=>{
      fetch('https://api.opensea.io/api/v1/assets?owner=0x848AE001e8378A7409337453C1D8f5B779945578&order_direction=desc&limit=200&include_orders=false')
      .then(response => response.json()).then((assets) => setNfts(assets.assets));
    }, []); // get data from opensea

    useEffect(()=>{
      fetch('https://youtube.googleapis.com/youtube/v3/search?part=snippet&channelId=UCwZA4pIiYSJO9yrXOlcUMfQ&maxResults=3&order=date&key=AIzaSyDlI39i18q3VsuxcpwN4viDTitXUReCZkQ')
      .then(response => response.json()).then((vids) => setVideos(vids.items));
    }, []);//API : AIzaSyDlI39i18q3VsuxcpwN4viDTitXUReCZkQ

    useEffect(()=>{
      fetch('https://v1.nocodeapi.com/frnk/medium/WYojXOwHqYlmoYft')
      .then(response => response.json()).then((items) => setArticles(items));
    }, []);

    useEffect(()=>{
      const processedNfts = nfts.filter((nft) => {
        if (nft.collection.external_url) {
          var putEmIn = nft.collection.external_url
            .includes('nclyne')
            && (nft.name
              .toLocaleLowerCase()
              .includes(searchField)
              || nft.description
                .toLocaleLowerCase()
                .includes(searchField));
          return putEmIn;
        } else {
          return false;
        }      
      }); 
      setNclyneNfts(processedNfts);
    }, [nfts, searchField]);

  
     
  const homeButtons = [{buttonName: "Projects", action: "projects"},
  {buttonName: "Services", action: "calendar", modal: true, openModal: open, setOpenModal: setOpen},
  {buttonName: "Contact Us", action: "contactus", modal: true, openModal: open1, setOpenModal: setOpen1},
 {buttonName: "Gallery", action: "gallery"},
 {buttonName: "Shop", action: "shopify", href: "https://nclyne.shop"},
{buttonName: "Content", action: "content"}];



    const onSearchChange = (event) => {
      const searchString = event.target.value.toLocaleLowerCase();
      setSearchField(searchString);
  
    };
    $(".shopify-buy-frame > iframe").slideUp();


    return(


        <Routes> 
          <Route path='/' element={
              <LogoTagSiteStarter logo={logo} 
              tagline="Helping creators take the next step" 
              socials={socials} setShopifyActive={setShopifyActive}/>
          }>
            <Route index element={<Home buttons={homeButtons} open={open} setOpen={setOpen} setShopifyActive={setShopifyActive}/>}/>
            <Route path='projects' element={ <Projects spaceLooters={spaceLooters} 
            curatedByNclyne={curatedByNclyne}
            onSearchChange={onSearchChange}
            nclyneNfts={nclyneNfts} />}/>
            <Route path="gallery" element={<Gallery gallery={gallery} setGallery={setGallery}/>}>

            </Route>
            <Route path="content" element={<Content videos={videos} articles={articles}></Content>} />
          
          </Route>
        
        </Routes>
       

        

      

  
 
    )

}//filterNFTs


// class App extends Component {

//   constructor() {
//     super();

//     this.state = {
//       socials: [
//                   { platform: "game",
//                   link: "https://oncyber.io/nclyne"},
//                   { platform: "medium",
//                   link: "https://medium.com/nclyne"},
//                   { platform: "youtube",
//                   link: "https://www.youtube.com/channel/UCwZA4pIiYSJO9yrXOlcUMfQ"},
//                   { platform: "twitter",
//                   link: "https://twitter.com/nclynenft"},
//                   { platform: "instagram",
//                   link: "https://instagram.com/nclynenft"},
//                   { platform: "twitch",
//                   link: "https://www.twitch.tv/nclynenft"},
//                   { platform: "discord",
//                    link: "https://discord.com/invite/QXrYuwzM24"}
                  
//                 ],
//       buttons: [{ platform: "Gallery",
//       link: "https://oncyber.io/nclyne"},
//       { platform: "Become an Nclyned Artist",
//       link: "https://medium.com/nclyne"},
//       { platform: "NFTs 101",
//       link: "https://www.youtube.com/channel/UCwZA4pIiYSJO9yrXOlcUMfQ"}],
//       nfts: [],
//       nftSearch: ''
//     };


//   }
//   componentDidMount() {


//     fetch('https://api.opensea.io/api/v1/assets?owner=0x848AE001e8378A7409337453C1D8f5B779945578&order_direction=desc&limit=200&include_orders=false')
//       .then(response => response.json()).then((assets) => this.setState(
//         () => {


//           return { nfts: assets.assets };
//         },
//         () => {
//           console.log("Data from OpenSea");
//         },
//       ));
//   }

//   onSearchChange = (event) => {
//     const nftSearch = event.target.value.toLocaleLowerCase();
//     this.setState(() => {
//       return { nftSearch };
//     })

//   };

//   render() {
//     const nclyneNFTs = this.state.nfts.filter((nft) => {
//       if (nft.collection.external_url) {
//         var putEmIn = nft.collection.external_url
//           .includes('nclyne')
//           && (nft.name
//             .toLocaleLowerCase()
//             .includes(this.state.nftSearch)
//             || nft.description
//               .toLocaleLowerCase()
//               .includes(this.state.nftSearch));
//         return putEmIn;
//       } else {
//         return false;
//       }
//     });

//     const { onSearchChange } = this;
//     const { socials, buttons } = this.state


//     return (


//     );
//   }
// }

export default App;
