export const getFechaLocal = (): string => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000; // offset en milisegundos
    return new Date(Date.now() - tzoffset).toISOString().split('T')[0];
};


export const getFechaYHoraLocal = (): string => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzoffset).toISOString().slice(0, 19).replace('T', ' ');
};