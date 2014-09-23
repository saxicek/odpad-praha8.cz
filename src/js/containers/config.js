define(function () {

  "use strict";

  return {
    // set map center
    mapCenter: [50.11, 14.47],
    // Prague borders
    borders: {
      minLat: 49.942,
      maxLat: 50.1775,
      minLng: 14.2245,
      maxLng: 14.7069
    },
    defaultDistrictName: 'Praha',
    // big screen detection
    bigScreen: (document.body.clientWidth > 767),
    containerTypes: {
      "BIO_WASTE": {
        label: 'Bioodpad',
        icon: {
          icon: 'tree-deciduous',
          markerColor: 'green'
        },
        allowed: 'listí, tráva, plevel, zbytky ovoce, zeleniny, čajové sáčky, kávová sedlina, zbytky rostlin, piliny, větve, dřevní štěpka z větví stromů a keřů, hlína z květináčů, spadané ovoce atd.',
        forbidden: 'zbytky jídel (tzv. gastroodpad), jedlé oleje, kosti, maso, kůže, uhynulá zvířata, exkrementy masožravých zvířat, znečištěné piliny a všechny další bioologicky nerozložitelné odpady'
      },
      "ELECTRO_WASTE": {
        label: 'Elektroodpad',
        icon: {
          icon: 'flash',
          prefix: 'fa',
          markerColor: 'orange'
        },
        allowed: 'baterie a drobná elektrozařízení - kalkulačky, rádia, drobné počítačové vybavení, discmany, telefony, elektronické hračky atd.',
        forbidden: 'televizory, počítačové monitory, zářivky, úsporné žárovky a velké domácí spotřebiče jako například ledničky, pračky, chladničky atd.'
      },
      "HAZARDOUS_WASTE": {
        label: 'Nebezpečný odpad',
        icon: {
          icon: 'exclamation-triangle',
          prefix: 'fa',
          markerColor: 'red'
        },
        allowed: 'baterie, akumulátory,nádoby od sprejů, zahradní chemie, mazací oleje a tuky, ředidla a barvy, léky a teploměry, kyseliny a hydroxidy, lepidla a pryskyřice, detergenty (odmašťovací přípravky), fotochemikálie, pesticidy (přípravky na hubení hmyzu, hlodavců, plevelu, odstraňování plísní), zářivky a výbojky'
      },
      "TEXTILE": {
        label: 'Textil',
        icon: {
          icon: 'trash-o',
          prefix: 'fa',
          markerColor: 'darkred'
        },
        allowed: 'nepotřebné šatstvo, obuv v použitelném stavu – spárovaná či zabalená, oděvní doplňky, hračky, drobný bytový textil, lůžkoviny, případně zbytky látek či pletacích přízí (ne malé odstřižky) - zabalené, suché a v nejlepším případě čisté',
        forbidden: 'odpadní textil'
      },
      "BULK_WASTE": {
        label: 'Velkoobjemový odpad',
        icon: {
          icon: 'trash-o',
          prefix: 'fa',
          iconColor: 'blue'
        },
        allowed: 'starý nábytek, koberce a linolea, zrcadla, umyvadla, vany a WC mísy, staré sportovní náčiní, autosklo a kovové předměty',
        forbidden: 'živnostenský odpad, nebezpečný odpad (např.: autobaterie, zářivky, barvy, rozpouštědla, motorové oleje a obaly od nich), bioodpad, stavební odpad, pneumatiky, elektrospotřebiče, televizory a pc monitory, počítače, lednice, mrazáky a sporáky'
      },
      "MOBILE_WASTE_COLLECTION_YARD": {
        label: 'Mobilní sběrný dvůr',
        icon: {
          icon: 'home',
          prefix: 'fa',
          markerColor: 'cadetblue'
        },
        allowed: 'baterie, akumulátory, nádoby od sprejů, zahradní chemie, mazací oleje a tuky, ředidla a barvy, láky a teploměry, kyseliny a hydroxidy, lepidla a pryskyřice, detergenty (odmašťovací přípravky), fotochemie, pesticidy (přípravky na hubení hmyzu, hlodavců, plevele a odstraňování plísní), zářivky a výbojky'
      },
      "WASTE_COLLECTION_YARD": {
        label: 'Sběrný dvůr',
        icon: {
          icon: 'home',
          prefix: 'fa',
          markerColor: 'cadetblue'
        }
      },
      // this special type is fall back variant
      // it is used for all other container types
      "__DEFAULT__": {
        label: 'Ostatní',
        icon: {
          icon: 'trash-o',
          prefix: 'fa',
          markerColor: 'darkgreen'
        }
      }
    }
  };

});

