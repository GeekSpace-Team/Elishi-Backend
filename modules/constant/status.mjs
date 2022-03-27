export const ProductLimit = 50;

export const productStatuses = [
    {
        value:"1",
        label:"Active",
        color:"#FFFFFF"
    },
    {
        value:"0",
        label:"Passive",
        color:"rgb(255, 93, 93)"
    },
    {
        value:"2",
        label:"Master",
        color:"rgb(7, 185, 255)"
    },
    {
        value:"3",
        label:"Vip",
        color:"rgb(255, 127, 7)"
    },
    {
        value:"4",
        label:"Canceled",
        color:"#c81d25"
    }
];

export const genders = [
    {
        value:1,
        label:"Man"
    },
    {
        value:2,
        label:"Women"
    }
];

export const userStatuses = [
    {
        value:1,
        label:"Active"
    },
    {
        value:0,
        label:"Passive"
    }
];

export const checkStatus=(status)=>{
    const res = productStatuses.filter(item=>item.value==status);
    return res[0];
}

export const checkUserStatus=(status)=>{
    const res = userStatuses.filter(item=>item.value==status);
    return res[0];
}

export const checkGender=(gender)=>{
    const res = genders.filter(item=>item.value==gender);
    return res[0];
}