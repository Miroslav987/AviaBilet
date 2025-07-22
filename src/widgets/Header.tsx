import Link from 'next/link';
import React from 'react';

const Header = () => {
    return (
        <div style={{display:'flex', justifyContent:'center', gap:10}}>
            <Link href={'/'}>Amadeus</Link>
            <Link href={'/duffel'}>Duffel</Link>
            <Link href={'/travelpayouts'}>Travelpayouts</Link>
        </div>
    );
};

export default Header;