(function () {
    var scriptURL = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
    if (window.ShopifyBuy) {
      if (window.ShopifyBuy.UI) {
        ShopifyBuyInit();
      } else {
        loadScript();
      }
    } else {
      loadScript();
    }
    function loadScript() {
      var script = document.createElement('script');
      script.async = true;
      script.src = scriptURL;
      (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(script);
      script.onload = ShopifyBuyInit;
    }
    function ShopifyBuyInit() {
      var client = ShopifyBuy.buildClient({
        domain: 'nclyne-3769.myshopify.com',
        storefrontAccessToken: '65765a56d9b42171ad768a2834b4ea5a',
      });
      ShopifyBuy.UI.onReady(client).then(function (ui) {
        ui.createComponent('collection', {
          id: '428875514172',
          node: document.getElementById('collection-component-1669623822728'),
          moneyFormat: '%24%7B%7Bamount%7D%7D',
          options: {
    "product": {
      "styles": {
        "product": {
          "@media (min-width: 601px)": {
            "max-width": "calc(33.33333% - 30px)",
            "margin-left": "30px",
            "margin-bottom": "50px",
            "width": "calc(33.33333% - 30px)"
          },
          "img": {
            "height": "calc(100% - 15px)",
            "position": "absolute",
            "left": "0",
            "right": "0",
            "top": "0"
          },
          "imgWrapper": {
            "padding-top": "calc(75% + 15px)",
            "position": "relative",
            "height": "0"
          }
        },
        "title": {
          "font-family": "Roboto, sans-serif",
          "color": "#fff6e6"
        },
        "button": {
          "font-family": "Roboto, sans-serif",
          "font-weight": "bold",
          "font-size": "18px",
          "padding-top": "17px",
          "padding-bottom": "17px",
          "color": "#e2b74f",
          ":hover": {
            "color": "#e2b74f",
            "background-color": "#443105"
          },
          "background-color": "#281d03",
          ":focus": {
            "background-color": "#443105"
          },
          "border-radius": "12px",
          "padding-left": "84px",
          "padding-right": "84px"
        },
        "quantityInput": {
          "font-size": "18px",
          "padding-top": "17px",
          "padding-bottom": "17px"
        },
        "price": {
          "font-family": "Roboto, sans-serif",
          "font-weight": "bold",
          "color": "#fff6e6"
        },
        "compareAt": {
          "font-family": "Roboto, sans-serif",
          "font-weight": "bold",
          "color": "#fff6e6"
        },
        "unitPrice": {
          "font-family": "Roboto, sans-serif",
          "font-weight": "bold",
          "color": "#fff6e6"
        }
      },
      "text": {
        "button": "Add to cart"
      },
      "googleFonts": [
        "Roboto"
      ]
    },
    "productSet": {
      "styles": {
        "products": {
          "@media (min-width: 601px)": {
            "margin-left": "-30px"
          }
        }
      }
    },
    "modalProduct": {
      "contents": {
        "img": false,
        "imgWithCarousel": true,
        "button": false,
        "buttonWithQuantity": true
      },
      "styles": {
        "product": {
          "@media (min-width: 601px)": {
            "max-width": "100%",
            "margin-left": "0px",
            "margin-bottom": "0px"
          }
        },
        "button": {
          "font-family": "Roboto, sans-serif",
          "font-weight": "bold",
          "font-size": "18px",
          "padding-top": "17px",
          "padding-bottom": "17px",
          "color": "#e2b74f",
          ":hover": {
            "color": "#e2b74f",
            "background-color": "#443105"
          },
          "background-color": "#281d03",
          ":focus": {
            "background-color": "#443105"
          },
          "border-radius": "12px",
          "padding-left": "84px",
          "padding-right": "84px"
        },
        "quantityInput": {
          "font-size": "18px",
          "padding-top": "17px",
          "padding-bottom": "17px"
        },
        "title": {
          "font-family": "Helvetica Neue, sans-serif",
          "font-weight": "bold",
          "font-size": "26px",
          "color": "#4c4c4c"
        },
        "price": {
          "font-family": "Helvetica Neue, sans-serif",
          "font-weight": "normal",
          "font-size": "18px",
          "color": "#4c4c4c"
        },
        "compareAt": {
          "font-family": "Helvetica Neue, sans-serif",
          "font-weight": "normal",
          "font-size": "15.299999999999999px",
          "color": "#4c4c4c"
        },
        "unitPrice": {
          "font-family": "Helvetica Neue, sans-serif",
          "font-weight": "normal",
          "font-size": "15.299999999999999px",
          "color": "#4c4c4c"
        }
      },
      "googleFonts": [
        "Roboto"
      ],
      "text": {
        "button": "Add to cart"
      }
    },
    "option": {
      "styles": {
        "label": {
          "font-family": "Roboto, sans-serif",
          "font-weight": "bold"
        },
        "select": {
          "font-family": "Roboto, sans-serif",
          "font-weight": "bold"
        }
      },
      "googleFonts": [
        "Roboto"
      ]
    },
    "cart": {
      "styles": {
        "button": {
          "font-family": "Roboto, sans-serif",
          "font-weight": "bold",
          "font-size": "18px",
          "padding-top": "17px",
          "padding-bottom": "17px",
          "color": "#e2b74f",
          ":hover": {
            "color": "#e2b74f",
            "background-color": "#443105"
          },
          "background-color": "#281d03",
          ":focus": {
            "background-color": "#443105"
          },
          "border-radius": "12px"
        },
        "cart": {
          "background-color": "#fff6e6"
        },
        "footer": {
          "background-color": "#fff6e6"
        }
      },
      "text": {
        "total": "Subtotal",
        "button": "Checkout"
      },
      "popup": false,
      "googleFonts": [
        "Roboto"
      ]
    },
    "toggle": {
      "styles": {
        "toggle": {
          "font-family": "Roboto, sans-serif",
          "font-weight": "bold",
          "background-color": "#281d03",
          ":hover": {
            "background-color": "#443105"
          },
          ":focus": {
            "background-color": "#443105"
          }
        },
        "count": {
          "font-size": "18px",
          "color": "#e2b74f",
          ":hover": {
            "color": "#e2b74f"
          }
        },
        "iconPath": {
          "fill": "#e2b74f"
        }
      },
      "googleFonts": [
        "Roboto"
      ]
    }
  },
        });
      });
    }
  })();
  