import React from 'react';
function Hero () {
    return ( 
       <div className='container p-5'>
        <div className="row">
            <img src='media/images/homeHero.png'  alt='Hero Image' className='mb-5'/>
             </div>
             <div className="d-flex flex-column align-items-center text-center mt-5">
  <h1 className="mt-5"> Invest in Everything </h1>
  <p>Online platform to invest in stocks, derivatives, mutual funds, ETFs, bonds, and more</p>
  <button className="p-3 btn btn-primary fs-5" style={{ width: "20%" }}>Signup Now</button>
</div>

        

       </div>
     );
}

export default Hero;