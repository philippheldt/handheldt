const navBar = `
    <div class="nav-wrapper">
        <nav>
            <div></div>
            <div></div>
            <div></div>
            <a class="button-hover" href="index.html#about">Über uns</a>
            <a class="image-hover" href="index.html"><img class="wave" src="img/logo.png" alt=""></a>
            <a class="button-hover" href="shop.html">Shop</a>
            <div></div>
            <div></div>
            <a href="shop.html#!/~/cart">
            <div class="ec-cart-widget"></div>
            </a>
            <div></div>
        </nav>
    </div>
`;
const footer = `
    <section class="full-white">
        <div class="content-wrapper two-column-force">
            <div class="author">
                © Webseite ✋🏼-gemacht von <a href="https://www.philippjenny.de"> Philipp Heldt</a>
            </div>
            <div class="payment-icons">
                <svg xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 576 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
                    <path
                        d="M470.1 231.3s7.6 37.2 9.3 45H446c3.3-8.9 16-43.5 16-43.5-.2 .3 3.3-9.1 5.3-14.9l2.8 13.4zM576 80v352c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V80c0-26.5 21.5-48 48-48h480c26.5 0 48 21.5 48 48zM152.5 331.2L215.7 176h-42.5l-39.3 106-4.3-21.5-14-71.4c-2.3-9.9-9.4-12.7-18.2-13.1H32.7l-.7 3.1c15.8 4 29.9 9.8 42.2 17.1l35.8 135h42.5zm94.4 .2L272.1 176h-40.2l-25.1 155.4h40.1zm139.9-50.8c.2-17.7-10.6-31.2-33.7-42.3-14.1-7.1-22.7-11.9-22.7-19.2 .2-6.6 7.3-13.4 23.1-13.4 13.1-.3 22.7 2.8 29.9 5.9l3.6 1.7 5.5-33.6c-7.9-3.1-20.5-6.6-36-6.6-39.7 0-67.6 21.2-67.8 51.4-.3 22.3 20 34.7 35.2 42.2 15.5 7.6 20.8 12.6 20.8 19.3-.2 10.4-12.6 15.2-24.1 15.2-16 0-24.6-2.5-37.7-8.3l-5.3-2.5-5.6 34.9c9.4 4.3 26.8 8.1 44.8 8.3 42.2 .1 69.7-20.8 70-53zM528 331.4L495.6 176h-31.1c-9.6 0-16.9 2.8-21 12.9l-59.7 142.5H426s6.9-19.2 8.4-23.3H486c1.2 5.5 4.8 23.3 4.8 23.3H528z" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 576 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
                    <path
                        d="M482.9 410.3c0 6.8-4.6 11.7-11.2 11.7-6.8 0-11.2-5.2-11.2-11.7 0-6.5 4.4-11.7 11.2-11.7 6.6 0 11.2 5.2 11.2 11.7zm-310.8-11.7c-7.1 0-11.2 5.2-11.2 11.7 0 6.5 4.1 11.7 11.2 11.7 6.5 0 10.9-4.9 10.9-11.7-.1-6.5-4.4-11.7-10.9-11.7zm117.5-.3c-5.4 0-8.7 3.5-9.5 8.7h19.1c-.9-5.7-4.4-8.7-9.6-8.7zm107.8 .3c-6.8 0-10.9 5.2-10.9 11.7 0 6.5 4.1 11.7 10.9 11.7 6.8 0 11.2-4.9 11.2-11.7 0-6.5-4.4-11.7-11.2-11.7zm105.9 26.1c0 .3 .3 .5 .3 1.1 0 .3-.3 .5-.3 1.1-.3 .3-.3 .5-.5 .8-.3 .3-.5 .5-1.1 .5-.3 .3-.5 .3-1.1 .3-.3 0-.5 0-1.1-.3-.3 0-.5-.3-.8-.5-.3-.3-.5-.5-.5-.8-.3-.5-.3-.8-.3-1.1 0-.5 0-.8 .3-1.1 0-.5 .3-.8 .5-1.1 .3-.3 .5-.3 .8-.5 .5-.3 .8-.3 1.1-.3 .5 0 .8 0 1.1 .3 .5 .3 .8 .3 1.1 .5s.2 .6 .5 1.1zm-2.2 1.4c.5 0 .5-.3 .8-.3 .3-.3 .3-.5 .3-.8 0-.3 0-.5-.3-.8-.3 0-.5-.3-1.1-.3h-1.6v3.5h.8V426h.3l1.1 1.4h.8l-1.1-1.3zM576 81v352c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V81c0-26.5 21.5-48 48-48h480c26.5 0 48 21.5 48 48zM64 220.6c0 76.5 62.1 138.5 138.5 138.5 27.2 0 53.9-8.2 76.5-23.1-72.9-59.3-72.4-171.2 0-230.5-22.6-15-49.3-23.1-76.5-23.1-76.4-.1-138.5 62-138.5 138.2zm224 108.8c70.5-55 70.2-162.2 0-217.5-70.2 55.3-70.5 162.6 0 217.5zm-142.3 76.3c0-8.7-5.7-14.4-14.7-14.7-4.6 0-9.5 1.4-12.8 6.5-2.4-4.1-6.5-6.5-12.2-6.5-3.8 0-7.6 1.4-10.6 5.4V392h-8.2v36.7h8.2c0-18.9-2.5-30.2 9-30.2 10.2 0 8.2 10.2 8.2 30.2h7.9c0-18.3-2.5-30.2 9-30.2 10.2 0 8.2 10 8.2 30.2h8.2v-23zm44.9-13.7h-7.9v4.4c-2.7-3.3-6.5-5.4-11.7-5.4-10.3 0-18.2 8.2-18.2 19.3 0 11.2 7.9 19.3 18.2 19.3 5.2 0 9-1.9 11.7-5.4v4.6h7.9V392zm40.5 25.6c0-15-22.9-8.2-22.9-15.2 0-5.7 11.9-4.8 18.5-1.1l3.3-6.5c-9.4-6.1-30.2-6-30.2 8.2 0 14.3 22.9 8.3 22.9 15 0 6.3-13.5 5.8-20.7 .8l-3.5 6.3c11.2 7.6 32.6 6 32.6-7.5zm35.4 9.3l-2.2-6.8c-3.8 2.1-12.2 4.4-12.2-4.1v-16.6h13.1V392h-13.1v-11.2h-8.2V392h-7.6v7.3h7.6V416c0 17.6 17.3 14.4 22.6 10.9zm13.3-13.4h27.5c0-16.2-7.4-22.6-17.4-22.6-10.6 0-18.2 7.9-18.2 19.3 0 20.5 22.6 23.9 33.8 14.2l-3.8-6c-7.8 6.4-19.6 5.8-21.9-4.9zm59.1-21.5c-4.6-2-11.6-1.8-15.2 4.4V392h-8.2v36.7h8.2V408c0-11.6 9.5-10.1 12.8-8.4l2.4-7.6zm10.6 18.3c0-11.4 11.6-15.1 20.7-8.4l3.8-6.5c-11.6-9.1-32.7-4.1-32.7 15 0 19.8 22.4 23.8 32.7 15l-3.8-6.5c-9.2 6.5-20.7 2.6-20.7-8.6zm66.7-18.3H408v4.4c-8.3-11-29.9-4.8-29.9 13.9 0 19.2 22.4 24.7 29.9 13.9v4.6h8.2V392zm33.7 0c-2.4-1.2-11-2.9-15.2 4.4V392h-7.9v36.7h7.9V408c0-11 9-10.3 12.8-8.4l2.4-7.6zm40.3-14.9h-7.9v19.3c-8.2-10.9-29.9-5.1-29.9 13.9 0 19.4 22.5 24.6 29.9 13.9v4.6h7.9v-51.7zm7.6-75.1v4.6h.8V302h1.9v-.8h-4.6v.8h1.9zm6.6 123.8c0-.5 0-1.1-.3-1.6-.3-.3-.5-.8-.8-1.1-.3-.3-.8-.5-1.1-.8-.5 0-1.1-.3-1.6-.3-.3 0-.8 .3-1.4 .3-.5 .3-.8 .5-1.1 .8-.5 .3-.8 .8-.8 1.1-.3 .5-.3 1.1-.3 1.6 0 .3 0 .8 .3 1.4 0 .3 .3 .8 .8 1.1 .3 .3 .5 .5 1.1 .8 .5 .3 1.1 .3 1.4 .3 .5 0 1.1 0 1.6-.3 .3-.3 .8-.5 1.1-.8 .3-.3 .5-.8 .8-1.1 .3-.6 .3-1.1 .3-1.4zm3.2-124.7h-1.4l-1.6 3.5-1.6-3.5h-1.4v5.4h.8v-4.1l1.6 3.5h1.1l1.4-3.5v4.1h1.1v-5.4zm4.4-80.5c0-76.2-62.1-138.3-138.5-138.3-27.2 0-53.9 8.2-76.5 23.1 72.1 59.3 73.2 171.5 0 230.5 22.6 15 49.5 23.1 76.5 23.1 76.4 .1 138.5-61.9 138.5-138.4z" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 576 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
                    <path
                        d="M0 432c0 26.5 21.5 48 48 48H528c26.5 0 48-21.5 48-48v-1.1H514.3l-31.9-35.1-31.9 35.1H246.8V267.1H181L262.7 82.4h78.6l28.1 63.2V82.4h97.2L483.5 130l17-47.6H576V80c0-26.5-21.5-48-48-48H48C21.5 32 0 53.5 0 80V432zm440.4-21.7L482.6 364l42 46.3H576l-68-72.1 68-72.1H525.4l-42 46.7-41.5-46.7H390.5L458 338.6l-67.4 71.6V377.1h-83V354.9h80.9V322.6H307.6V300.2h83V267.1h-122V410.3H440.4zm96.3-72L576 380.2V296.9l-39.3 41.4zm-36.3-92l36.9-100.6V246.3H576V103H515.8l-32.2 89.3L451.7 103H390.5V246.1L327.3 103H276.1L213.7 246.3h43l11.9-28.7h65.9l12 28.7h82.7V146L466 246.3h34.4zM282 185.4l19.5-46.9 19.4 46.9H282z" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 576 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
                    <path
                        d="M302.2 218.4c0 17.2-10.5 27.1-29 27.1h-24.3v-54.2h24.4c18.4 0 28.9 9.8 28.9 27.1zm47.5 62.6c0 8.3 7.2 13.7 18.5 13.7 14.4 0 25.2-9.1 25.2-21.9v-7.7l-23.5 1.5c-13.3 .9-20.2 5.8-20.2 14.4zM576 79v352c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V79c0-26.5 21.5-48 48-48h480c26.5 0 48 21.5 48 48zM127.8 197.2c8.4 .7 16.8-4.2 22.1-10.4 5.2-6.4 8.6-15 7.7-23.7-7.4 .3-16.6 4.9-21.9 11.3-4.8 5.5-8.9 14.4-7.9 22.8zm60.6 74.5c-.2-.2-19.6-7.6-19.8-30-.2-18.7 15.3-27.7 16-28.2-8.8-13-22.4-14.4-27.1-14.7-12.2-.7-22.6 6.9-28.4 6.9-5.9 0-14.7-6.6-24.3-6.4-12.5 .2-24.2 7.3-30.5 18.6-13.1 22.6-3.4 56 9.3 74.4 6.2 9.1 13.7 19.1 23.5 18.7 9.3-.4 13-6 24.2-6 11.3 0 14.5 6 24.3 5.9 10.2-.2 16.5-9.1 22.8-18.2 6.9-10.4 9.8-20.4 10-21zm135.4-53.4c0-26.6-18.5-44.8-44.9-44.8h-51.2v136.4h21.2v-46.6h29.3c26.8 0 45.6-18.4 45.6-45zm90 23.7c0-19.7-15.8-32.4-40-32.4-22.5 0-39.1 12.9-39.7 30.5h19.1c1.6-8.4 9.4-13.9 20-13.9 13 0 20.2 6 20.2 17.2v7.5l-26.4 1.6c-24.6 1.5-37.9 11.6-37.9 29.1 0 17.7 13.7 29.4 33.4 29.4 13.3 0 25.6-6.7 31.2-17.4h.4V310h19.6v-68zM516 210.9h-21.5l-24.9 80.6h-.4l-24.9-80.6H422l35.9 99.3-1.9 6c-3.2 10.2-8.5 14.2-17.9 14.2-1.7 0-4.9-.2-6.2-.3v16.4c1.2 .4 6.5 .5 8.1 .5 20.7 0 30.4-7.9 38.9-31.8L516 210.9z" />
                </svg>
                <svg width="100%" height="100%" viewBox="0 0 576 512" version="1.1" xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/"
                    style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
                    <path
                        d="M576,81L576,433C576,459.5 554.5,481 528,481L48,481C21.5,481 0,459.5 0,433L0,81C0,54.5 21.5,33 48,33L528,33C554.5,33 576,54.5 576,81ZM335.999,189.594C327.733,181.33 316.443,176.785 304.756,177.02L256.464,177.02L256.464,321.047L274.67,321.047L274.67,262.727L304.756,262.727C317.099,262.727 327.513,258.561 335.999,250.461L338.082,248.378C353.414,231.606 352.516,205.283 336.076,189.594L335.999,189.594ZM323.193,237.578C318.554,242.531 312.003,245.258 305.219,245.061L274.67,245.061L274.67,194.763L305.219,194.763C311.737,194.733 318.009,197.286 322.653,201.86C332.437,211.573 332.713,227.533 323.271,237.578L323.193,237.578ZM423.095,230.249C415.303,222.998 404.657,219.372 391.157,219.372C373.8,219.372 360.84,225.775 352.199,238.581L368.323,248.841C374.237,240.098 382.286,235.726 392.469,235.726C398.967,235.738 405.236,238.158 410.057,242.515C414.751,246.62 417.452,252.557 417.463,258.792L417.463,263.035C410.443,259.101 401.572,257.018 390.771,257.018C378.12,257.018 367.86,260.027 360.3,266.121C352.739,272.215 348.882,280.238 348.882,290.498C348.623,299.748 352.569,308.634 359.605,314.644C366.78,321.047 375.805,324.287 386.451,324.287C399.026,324.287 408.977,318.656 416.537,307.393L417.309,307.393L417.309,321.047L434.743,321.047L434.743,260.335C434.821,247.606 430.963,237.423 423.095,230.249ZM408.283,299.139C402.882,304.653 395.482,307.769 387.763,307.779C382.636,307.848 377.643,306.129 373.645,302.919C369.851,300.088 367.616,295.618 367.628,290.884C367.628,285.484 370.097,281.01 374.957,277.461C379.817,273.913 386.143,272.061 393.549,272.061C403.732,271.907 411.677,274.221 417.309,278.773C417.309,286.641 414.3,293.43 408.283,299.139ZM122.697,233.335L122.697,265.195L166.746,265.195C164.956,275.434 159.077,284.518 150.468,290.344C143.14,295.436 133.728,298.29 122.697,298.29C101.405,298.29 83.43,283.71 76.95,264.192C73.572,253.922 73.572,242.834 76.95,232.563C83.43,212.892 101.405,198.312 122.697,198.312C134.35,198.098 145.614,202.576 153.94,210.732L177.314,187.049C162.595,173.075 142.991,165.377 122.697,165.603C91.779,165.723 63.487,183.435 49.873,211.195C38.208,234.537 38.208,262.064 49.873,285.407L49.873,285.561C63.481,313.316 91.786,331.006 122.697,331.076C144.683,331.076 163.274,323.747 176.697,311.096C192.126,296.747 200.92,275.455 200.92,250.229C200.947,244.571 200.508,238.921 199.609,233.335L122.697,233.335ZM515.05,222.535L486.893,293.276L486.507,293.276L457.655,222.535L437.829,222.535L477.79,314.799L455.109,364.402L473.932,364.402L534.876,222.535L515.05,222.535Z" />
                </svg>

                <svg xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 576 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
                    <path
                        d="M186.3 258.2c0 12.2-9.7 21.5-22 21.5-9.2 0-16-5.2-16-15 0-12.2 9.5-22 21.7-22 9.3 0 16.3 5.7 16.3 15.5zM80.5 209.7h-4.7c-1.5 0-3 1-3.2 2.7l-4.3 26.7 8.2-.3c11 0 19.5-1.5 21.5-14.2 2.3-13.4-6.2-14.9-17.5-14.9zm284 0H360c-1.8 0-3 1-3.2 2.7l-4.2 26.7 8-.3c13 0 22-3 22-18-.1-10.6-9.6-11.1-18.1-11.1zM576 80v352c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V80c0-26.5 21.5-48 48-48h480c26.5 0 48 21.5 48 48zM128.3 215.4c0-21-16.2-28-34.7-28h-40c-2.5 0-5 2-5.2 4.7L32 294.2c-.3 2 1.2 4 3.2 4h19c2.7 0 5.2-2.9 5.5-5.7l4.5-26.6c1-7.2 13.2-4.7 18-4.7 28.6 0 46.1-17 46.1-45.8zm84.2 8.8h-19c-3.8 0-4 5.5-4.2 8.2-5.8-8.5-14.2-10-23.7-10-24.5 0-43.2 21.5-43.2 45.2 0 19.5 12.2 32.2 31.7 32.2 9 0 20.2-4.9 26.5-11.9-.5 1.5-1 4.7-1 6.2 0 2.3 1 4 3.2 4H200c2.7 0 5-2.9 5.5-5.7l10.2-64.3c.3-1.9-1.2-3.9-3.2-3.9zm40.5 97.9l63.7-92.6c.5-.5 .5-1 .5-1.7 0-1.7-1.5-3.5-3.2-3.5h-19.2c-1.7 0-3.5 1-4.5 2.5l-26.5 39-11-37.5c-.8-2.2-3-4-5.5-4h-18.7c-1.7 0-3.2 1.8-3.2 3.5 0 1.2 19.5 56.8 21.2 62.1-2.7 3.8-20.5 28.6-20.5 31.6 0 1.8 1.5 3.2 3.2 3.2h19.2c1.8-.1 3.5-1.1 4.5-2.6zm159.3-106.7c0-21-16.2-28-34.7-28h-39.7c-2.7 0-5.2 2-5.5 4.7l-16.2 102c-.2 2 1.3 4 3.2 4h20.5c2 0 3.5-1.5 4-3.2l4.5-29c1-7.2 13.2-4.7 18-4.7 28.4 0 45.9-17 45.9-45.8zm84.2 8.8h-19c-3.8 0-4 5.5-4.3 8.2-5.5-8.5-14-10-23.7-10-24.5 0-43.2 21.5-43.2 45.2 0 19.5 12.2 32.2 31.7 32.2 9.3 0 20.5-4.9 26.5-11.9-.3 1.5-1 4.7-1 6.2 0 2.3 1 4 3.2 4H484c2.7 0 5-2.9 5.5-5.7l10.2-64.3c.3-1.9-1.2-3.9-3.2-3.9zm47.5-33.3c0-2-1.5-3.5-3.2-3.5h-18.5c-1.5 0-3 1.2-3.2 2.7l-16.2 104-.3 .5c0 1.8 1.5 3.5 3.5 3.5h16.5c2.5 0 5-2.9 5.2-5.7L544 191.2v-.3zm-90 51.8c-12.2 0-21.7 9.7-21.7 22 0 9.7 7 15 16.2 15 12 0 21.7-9.2 21.7-21.5 .1-9.8-6.9-15.5-16.2-15.5z" />
                </svg>
                <svg viewBox="0 0 576 512" version="1.1" xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/"
                    style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
                    <path
                        d="M576,81L576,433C576,459.5 554.5,481 528,481L48,481C21.5,481 0,459.5 0,433L0,81C0,54.5 21.5,33 48,33L528,33C554.5,33 576,54.5 576,81ZM493.41,300.634L500.416,324.209L537.602,324.209L496.112,187.79L440.728,187.79L399.739,324.209L437.724,324.209L444.32,300.634L493.41,300.634ZM486.119,274.057L452.222,274.057L468.916,214.922L486.119,274.057ZM248.837,209.23C263.275,209.23 276.164,215.884 284.634,226.302L286.898,229.086L297.015,207.395L295.836,206.281C283.059,194.205 265.67,186.756 246.489,186.756C217.158,186.756 191.999,204.159 181.165,228.963C181.165,228.963 165.789,228.963 165.789,228.963L154.579,252.994L175.555,252.994C175.499,254.062 175.467,255.135 175.467,256.222C175.467,257.696 175.516,259.16 175.61,260.613C175.61,260.613 166.643,260.613 166.643,260.613L155.438,284.649L181.67,284.649C192.773,308.823 217.618,325.682 246.489,325.682C261.303,325.682 275.047,321.241 286.429,313.658L287.43,312.991L287.43,281.874L283.494,286.356C275.027,295.996 262.643,302.09 248.837,302.09C234.235,302.09 221.224,295.276 212.756,284.649C212.757,284.649 260.382,284.649 260.382,284.649L271.591,260.613L202.892,260.613C202.719,258.985 202.628,257.332 202.628,255.657C202.628,254.763 202.654,253.875 202.704,252.994C202.704,252.994 275.143,252.994 275.143,252.994L286.349,228.963L211.043,228.963C219.402,217.035 233.21,209.23 248.837,209.23ZM248.837,204.735C230.122,204.735 213.781,214.931 204.999,230.084L203.044,233.458L279.293,233.458L272.28,248.499L198.594,248.499L198.391,250.522C198.221,252.213 198.133,253.925 198.133,255.657C198.133,258.217 198.326,260.73 198.69,263.189L198.973,265.108L264.536,265.108L257.519,280.155L204.194,280.155L206.478,283.635C215.548,297.456 231.128,306.585 248.837,306.585C261.969,306.585 273.93,301.564 282.935,293.336C282.935,293.336 282.935,310.572 282.935,310.572C272.463,317.282 259.946,321.187 246.489,321.187C218.943,321.187 195.294,304.829 185.19,281.509L184.604,280.155L162.492,280.155C162.492,280.155 169.507,265.108 169.507,265.108L180.538,265.108L180.288,262.634C180.075,260.523 179.962,258.383 179.962,256.222C179.962,254.433 180.057,252.682 180.201,250.931L180.401,248.499L161.636,248.499L168.652,233.458L184.161,233.458L184.733,232.064C194.557,208.139 218.504,191.25 246.489,191.25C263.881,191.25 279.705,197.779 291.561,208.453C291.561,208.453 285.8,220.805 285.8,220.805C276.553,210.913 263.414,204.735 248.837,204.735ZM149.308,231.306C149.529,228.292 149.64,226.038 149.64,224.532C149.64,206.149 142.209,194.964 127.344,190.969C121.254,189.336 111.037,188.511 96.701,188.511C87.595,188.511 79.316,188.842 71.853,189.495C62.886,190.216 55.516,192.629 49.758,196.744C45.828,199.423 42.98,203.34 41.213,208.501C39.447,213.658 38.563,220.517 38.563,229.069C38.563,240.303 40.197,248.698 43.467,254.245C47.186,260.776 54.64,265.08 65.822,267.171C70.066,267.899 77.65,268.649 88.569,269.428C102.164,270.341 109.777,271.065 111.417,271.582C115.795,272.894 117.987,276.548 117.987,282.553C117.987,285.235 117.727,287.424 117.204,289.12C116.22,291.87 114.158,293.858 111.017,295.092C109.254,295.752 105.165,296.08 98.757,296.08L86.198,296.08C82.856,296.005 80.014,295.391 77.66,294.222C74.259,292.523 72.557,288.717 72.557,282.793C72.557,282.14 72.554,281.192 72.554,279.954L38.398,279.954C38.398,291.055 39.209,298.986 40.853,303.748C43.799,312.299 49.891,317.979 59.128,320.782C66.656,323.072 79.985,324.208 99.114,324.208C110.576,324.208 119.095,323.685 124.664,322.636C137.957,320.155 146.502,314.248 150.305,304.894C152.4,299.798 153.449,291.757 153.449,280.773C153.449,276.008 153.222,271.718 152.761,267.928C151.975,261.595 149.51,256.463 145.379,252.537C140.127,247.506 131.663,244.401 119.988,243.226C116.311,242.833 107.091,242.141 92.327,241.163L85.438,240.676C82.418,240.481 79.992,239.828 78.157,238.714C75.594,237.149 74.314,233.875 74.314,228.91C74.314,223.424 75.76,219.861 78.644,218.221C81.528,216.588 87.439,215.772 96.357,215.772C105.538,215.772 111.147,217.192 113.18,220.024C114.492,221.94 115.152,225.701 115.152,231.306L149.308,231.306ZM299.512,324.21L336.228,324.21L336.228,288.988L358.118,288.988L364.211,288.786C376.257,288.592 383.08,288.354 384.685,288.085C398.322,286.299 407.351,279.4 411.739,267.429C413.931,261.372 415.038,251.431 415.038,237.592C415.038,226.082 414.038,217.462 412.044,211.737C408.176,200.831 400.628,193.611 389.378,190.087C384.458,188.554 377.299,187.791 367.917,187.791L299.512,187.791L299.512,324.21ZM336.228,257.342L336.228,217.641L359.424,217.641C363.181,217.641 365.552,217.713 366.546,217.842C371.554,218.71 374.717,221.09 376.036,225.004C376.962,227.797 377.423,232.074 377.423,237.845C377.423,242.555 377.192,246.101 376.728,248.485C376.004,252.067 374.545,254.458 372.376,255.65C370.788,256.523 366.374,257.082 359.115,257.342L336.228,257.342Z" />
                </svg>
            </div>
        </div>

    </section>
    <section class="black">
        <footer class="content-wrapper">

            <div class="">
                <a href="impressum.html">Impressum</a>
                <img src="img/logotype.png" alt="">
                <a href="">Datenschutz</a>
            </div>

        </footer>
    </section>
`;

//add navBar to the body
document.body.insertAdjacentHTML("afterbegin", navBar);
// add footer to the body
document.body.insertAdjacentHTML("beforeend", footer);